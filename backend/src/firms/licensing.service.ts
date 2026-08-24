import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { FirmStatus } from '../database/entities/firm.entity';
import { LicenseStatus } from '../database/entities/license-key.entity';
import { TransactionStatus } from '../database/entities/transaction.entity';
import {
  GenerateLicenseKeyDto,
  ApplyLicenseKeyDto,
  RenewLicenseKeyDto,
} from './dto/license-key.dto';
import { CreateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class LicensingService {
  private readonly logger = new Logger(LicensingService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Generates a cryptographically random base32 character block
   */
  private generateBase32Block(length = 4): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  /**
   * Generates a license key in format: FIRM-XXXX-XXXX-XXXX
   */
  public generatePlaintextKey(): string {
    const block1 = this.generateBase32Block(4);
    const block2 = this.generateBase32Block(4);
    const block3 = this.generateBase32Block(4);
    return `FIRM-${block1}-${block2}-${block3}`;
  }

  /**
   * Helper to resolve firm from UUID or slug
   */
  async resolveFirm(idOrSlug: string) {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const firms = isUuid
      ? await this.dataSource.query(`SELECT * FROM public.firms WHERE id = $1 LIMIT 1`, [idOrSlug])
      : await this.dataSource.query(`SELECT * FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`, [idOrSlug.toLowerCase()]);

    if (firms.length === 0) {
      throw new NotFoundException(`Firm '${idOrSlug}' not found`);
    }
    return firms[0];
  }

  /**
   * Generates key, hashes with bcrypt, stores only hash + prefix, returns plaintext once.
   */
  async generateLicenseKey(idOrSlug: string, dto: GenerateLicenseKeyDto) {
    const firm = await this.resolveFirm(idOrSlug);

    const plaintextKey = this.generatePlaintextKey();
    const keyPrefix = plaintextKey.slice(0, 8); // e.g. "FIRM-A1B2"
    const saltRounds = 10;
    const keyHash = await bcrypt.hash(plaintextKey, saltRounds);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + dto.duration_days * 24 * 60 * 60 * 1000);

    const rows = await this.dataSource.query(
      `INSERT INTO public.license_keys (
        firm_id, key_hash, key_prefix, duration_days, amount, issued_at, expires_at, status, is_renewal, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', false, NOW(), NOW())
      RETURNING *`,
      [
        firm.id,
        keyHash,
        keyPrefix,
        dto.duration_days,
        dto.amount ?? 0,
        now,
        expiresAt,
      ],
    );

    const savedKey = rows[0];

    // Auto-record transaction receipt in public.transactions
    const txRef = `NRX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await this.dataSource.query(
        `INSERT INTO public.transactions (
          firm_id, license_key_id, amount, currency, payment_method, transaction_ref, status, paid_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())`,
        [
          firm.id,
          savedKey.id,
          savedKey.amount || (dto.amount ?? 0),
          'INR',
          'NORNX Platform Billing / Bank Transfer',
          txRef,
          'SUCCESS',
        ],
      );
    } catch {}

    return {
      message: 'License key generated successfully. Copy and store this key now; it will not be displayed again.',
      plaintext_key: plaintextKey,
      key_prefix: keyPrefix,
      duration_days: dto.duration_days,
      issued_at: savedKey.issued_at,
      expires_at: savedKey.expires_at,
      license_key_id: savedKey.id,
      transaction_ref: txRef,
    };
  }

  /**
   * Applies an existing plaintext key against a firm.
   * Compares bcrypt hash and activates the firm.
   */
  async applyLicenseKey(idOrSlug: string, dto: ApplyLicenseKeyDto) {
    const firm = await this.resolveFirm(idOrSlug);

    const rawKey = dto.key || (dto as any).plaintext_key || '';
    const cleanKey = rawKey.trim().toUpperCase();
    const prefix = cleanKey.slice(0, 8);

    const keys = await this.dataSource.query(
      `SELECT * FROM public.license_keys WHERE firm_id = $1 AND key_prefix = $2 AND status = 'ACTIVE' ORDER BY created_at DESC`,
      [firm.id, prefix],
    );

    if (keys.length === 0) {
      throw new BadRequestException('Invalid license key or key does not belong to this firm');
    }

    let matchedKey: any = null;
    for (const k of keys) {
      const match = await bcrypt.compare(cleanKey, k.key_hash);
      if (match) {
        matchedKey = k;
        break;
      }
    }

    if (!matchedKey) {
      throw new BadRequestException('License key verification failed. Key is invalid.');
    }

    const now = new Date();
    if (new Date(matchedKey.expires_at) <= now) {
      await this.dataSource.query(
        `UPDATE public.license_keys SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
        [matchedKey.id],
      );
      throw new BadRequestException('License key has already expired');
    }

    // Update firm to ACTIVE and set trial_ends_at to the license expires_at
    await this.dataSource.query(
      `UPDATE public.firms SET status = 'ACTIVE', trial_ends_at = $1, updated_at = NOW() WHERE id = $2`,
      [matchedKey.expires_at, firm.id],
    );

    this.logger.log(`Activated firm ID ${firm.id} with license prefix ${matchedKey.key_prefix}`);

    return {
      success: true,
      message: `License successfully verified and applied. Firm is now ACTIVE until ${new Date(matchedKey.expires_at).toLocaleDateString()}.`,
      firm_id: firm.id,
      status: FirmStatus.ACTIVE,
      expires_at: matchedKey.expires_at,
    };
  }

  /**
   * Renews license: generates new key, hashes it, sets new expiry, returns new plaintext once.
   */
  async renewLicenseKey(idOrSlug: string, dto: RenewLicenseKeyDto) {
    const firm = await this.resolveFirm(idOrSlug);

    const plaintextKey = this.generatePlaintextKey();
    const keyPrefix = plaintextKey.slice(0, 8);
    const saltRounds = 10;
    const keyHash = await bcrypt.hash(plaintextKey, saltRounds);

    const now = new Date();
    // Expiration is extended from current active expiry if still in the future, or from now
    const activeLicenses = await this.dataSource.query(
      `SELECT * FROM public.license_keys WHERE firm_id = $1 AND status = 'ACTIVE' AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1`,
      [firm.id],
    );

    const baseDate = activeLicenses.length > 0 ? new Date(activeLicenses[0].expires_at) : now;
    const expiresAt = new Date(baseDate.getTime() + dto.duration_days * 24 * 60 * 60 * 1000);

    const rows = await this.dataSource.query(
      `INSERT INTO public.license_keys (
        firm_id, key_hash, key_prefix, duration_days, amount, issued_at, expires_at, status, is_renewal, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', true, NOW(), NOW())
      RETURNING *`,
      [
        firm.id,
        keyHash,
        keyPrefix,
        dto.duration_days,
        dto.amount ?? 0,
        now,
        expiresAt,
      ],
    );

    const savedKey = rows[0];

    // Ensure firm is active and extend trial_ends_at
    await this.dataSource.query(
      `UPDATE public.firms SET status = 'ACTIVE', trial_ends_at = $1, updated_at = NOW() WHERE id = $2`,
      [expiresAt, firm.id],
    );

    // Auto-record renewal transaction receipt
    const txRef = `NRX-RNW-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await this.dataSource.query(
        `INSERT INTO public.transactions (
          firm_id, license_key_id, amount, currency, payment_method, transaction_ref, status, paid_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())`,
        [
          firm.id,
          savedKey.id,
          savedKey.amount || (dto.amount ?? 0),
          'INR',
          'NORNX License Renewal / Online Payment',
          txRef,
          'SUCCESS',
        ],
      );
    } catch {}

    return {
      message: 'License key renewed successfully. Copy and store this new key now; it will not be displayed again.',
      plaintext_key: plaintextKey,
      key_prefix: keyPrefix,
      duration_days: dto.duration_days,
      issued_at: savedKey.issued_at,
      expires_at: savedKey.expires_at,
      license_key_id: savedKey.id,
      transaction_ref: txRef,
      is_renewal: true,
    };
  }

  /**
   * Get all license keys for a firm (returns prefix only, NEVER plaintext or hash)
   */
  async getFirmLicenseKeys(idOrSlug: string) {
    const firm = await this.resolveFirm(idOrSlug);
    return await this.dataSource.query(
      `SELECT id, key_prefix, duration_days, amount, issued_at, expires_at, status, is_renewal, created_at
       FROM public.license_keys WHERE firm_id = $1 ORDER BY created_at DESC`,
      [firm.id],
    );
  }

  private async ensureTransactionColumns() {
    try {
      await this.dataSource.query(`
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS duration_days INT;
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT false;
      `);
    } catch {}
  }

  /**
   * Record transaction detail & auto-link generated license key
   */
  async recordTransaction(idOrSlug: string, dto: CreateTransactionDto) {
    await this.ensureTransactionColumns();
    const firm = await this.resolveFirm(idOrSlug);
    const durationDays = Number(dto.duration_days) || 1;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const refNo = dto.transaction_ref || `NRX-REC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let licenseKeyId: string | null = null;
    if (dto.duration_days) {
      const plainKey = this.generatePlaintextKey();
      const keyHash = await bcrypt.hash(plainKey, 10);
      const keyPrefix = plainKey.split('-').slice(0, 2).join('-');

      const lkRows = await this.dataSource.query(
        `INSERT INTO public.license_keys (
          firm_id, key_hash, key_prefix, duration_days, amount, issued_at, expires_at, status, is_renewal, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, NOW(), NOW())
        RETURNING id`,
        [
          firm.id,
          keyHash,
          keyPrefix,
          durationDays,
          dto.amount,
          now,
          expiresAt,
          dto.is_renewal ?? false,
        ],
      );

      if (lkRows.length > 0) {
        licenseKeyId = lkRows[0].id;
        await this.dataSource.query(
          `UPDATE public.firms SET status = 'ACTIVE', trial_ends_at = $1, trial_days = $2, updated_at = NOW() WHERE id = $3`,
          [expiresAt, durationDays, firm.id],
        );
      }
    }

    const rows = await this.dataSource.query(
      `INSERT INTO public.transactions (
        firm_id, license_key_id, transaction_ref, amount, currency, status, payment_method, duration_days, expires_at, is_renewal, paid_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
      RETURNING *`,
      [
        firm.id,
        licenseKeyId,
        refNo,
        dto.amount,
        dto.currency || 'INR',
        dto.status || 'SUCCESS',
        dto.payment_method || 'MANUAL',
        durationDays,
        expiresAt,
        dto.is_renewal ?? false,
      ],
    );

    return rows[0];
  }

  /**
   * Update transaction receipt details (duration days, amount, payment method, reference, status)
   */
  async updateTransaction(
    idOrSlug: string,
    txId: string,
    dto: { duration_days?: number; amount?: number; payment_method?: string; status?: string; transaction_ref?: string; is_renewal?: boolean },
  ) {
    await this.ensureTransactionColumns();
    const firm = await this.resolveFirm(idOrSlug);

    const existingTx = await this.dataSource.query(
      `SELECT * FROM public.transactions WHERE (id::text = $1 OR license_key_id::text = $1 OR transaction_ref = $1) AND firm_id = $2 LIMIT 1`,
      [txId, firm.id],
    );

    const durationDays = dto.duration_days !== undefined ? Number(dto.duration_days) : (existingTx[0]?.duration_days ?? 1);

    if (existingTx.length > 0) {
      const tx = existingTx[0];
      const newAmount = dto.amount !== undefined ? dto.amount : tx.amount;
      const newMethod = dto.payment_method || tx.payment_method;
      const newRef = dto.transaction_ref || tx.transaction_ref;
      const now = new Date();
      const isRenewal = dto.is_renewal ?? false;
      const baseDate = isRenewal ? now : new Date(tx.paid_at || tx.created_at || now);
      const newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      
      const explicitFirmStatus = (dto as any).firm_status || 
        (['ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED'].includes(dto.status as string) ? dto.status : undefined);
      const statusToSet = explicitFirmStatus || (newExpiresAt > now ? 'ACTIVE' : 'EXPIRED');
      const txStatus = newExpiresAt > now ? (dto.status || 'SUCCESS') : 'EXPIRED';

      await this.dataSource.query(
        `UPDATE public.transactions 
         SET amount = $1, payment_method = $2, status = $3, transaction_ref = $4, duration_days = $5, expires_at = $6, is_renewal = $7, updated_at = NOW()
         WHERE id = $8`,
        [newAmount, newMethod, txStatus, newRef, durationDays, newExpiresAt, isRenewal, tx.id],
      );

      if (tx.license_key_id) {
        await this.dataSource.query(
          `UPDATE public.license_keys 
           SET duration_days = $1, expires_at = $2, amount = $3, status = $4, is_renewal = $5, updated_at = NOW() 
           WHERE id = $6`,
          [durationDays, newExpiresAt, newAmount, statusToSet === 'SUSPENDED' ? 'SUSPENDED' : (newExpiresAt > now ? 'ACTIVE' : 'EXPIRED'), isRenewal, tx.license_key_id],
        );
      } else {
        await this.dataSource.query(
          `UPDATE public.license_keys 
           SET duration_days = $1, expires_at = $2, amount = $3, status = $4, is_renewal = $5, updated_at = NOW() 
           WHERE firm_id = $6`,
          [durationDays, newExpiresAt, newAmount, statusToSet === 'SUSPENDED' ? 'SUSPENDED' : (newExpiresAt > now ? 'ACTIVE' : 'EXPIRED'), isRenewal, firm.id],
        );
      }

      await this.dataSource.query(
        `UPDATE public.firms SET trial_ends_at = $1, trial_days = $2, status = $3, updated_at = NOW() WHERE id = $4`,
        [newExpiresAt, durationDays, statusToSet, firm.id],
      );
    } else {
      const lk = await this.dataSource.query(
        `SELECT * FROM public.license_keys WHERE (id::text = $1 OR key_prefix = $1) AND firm_id = $2 LIMIT 1`,
        [txId, firm.id],
      );
      if (lk.length > 0) {
        const now = new Date();
        const isRenewal = dto.is_renewal ?? (lk[0].is_renewal ?? false);
        const baseDate = isRenewal ? now : new Date(lk[0].issued_at || lk[0].created_at || now);
        const newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const newAmount = dto.amount !== undefined ? dto.amount : (lk[0].amount || 0);
        const explicitFirmStatus = (dto as any).firm_status || 
          (['ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED'].includes(dto.status as string) ? dto.status : undefined);
        const statusToSet = explicitFirmStatus || (newExpiresAt > now ? 'ACTIVE' : 'EXPIRED');
        const txStatus = newExpiresAt > now ? (dto.status || 'SUCCESS') : 'EXPIRED';

        await this.dataSource.query(
          `UPDATE public.license_keys 
           SET duration_days = $1, expires_at = $2, amount = $3, status = $4, is_renewal = $5, updated_at = NOW() 
           WHERE id = $6`,
          [durationDays, newExpiresAt, newAmount, statusToSet === 'SUSPENDED' ? 'SUSPENDED' : (newExpiresAt > now ? 'ACTIVE' : 'EXPIRED'), isRenewal, lk[0].id],
        );

        const refNo = dto.transaction_ref || `NRX-REC-${Date.now().toString(36).toUpperCase()}`;
        await this.dataSource.query(
          `INSERT INTO public.transactions (
            firm_id, license_key_id, transaction_ref, amount, currency, status, payment_method, duration_days, expires_at, is_renewal, paid_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 'INR', $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            firm.id,
            lk[0].id,
            refNo,
            newAmount,
            txStatus,
            dto.payment_method || 'Bank Transfer',
            durationDays,
            newExpiresAt,
            isRenewal,
            lk[0].issued_at || now,
          ],
        );

        await this.dataSource.query(
          `UPDATE public.firms SET trial_ends_at = $1, trial_days = $2, status = $3, updated_at = NOW() WHERE id = $4`,
          [newExpiresAt, durationDays, statusToSet, firm.id],
        );
      }
    }

    return {
      success: true,
      duration_days: durationDays,
      message: 'Receipt duration and transaction details updated successfully!',
    };
  }

  /**
   * Delete / Revoke License Key
   */
  async deleteLicenseKey(idOrSlug: string, keyId: string) {
    const firm = await this.resolveFirm(idOrSlug);

    // Delete associated transactions first if any
    await this.dataSource.query(
      `DELETE FROM public.transactions WHERE license_key_id::text = $1 AND firm_id = $2`,
      [keyId, firm.id],
    );

    // Delete license key
    await this.dataSource.query(
      `DELETE FROM public.license_keys WHERE id::text = $1 AND firm_id = $2`,
      [keyId, firm.id],
    );

    // Recalculate firm status and latest active trial_ends_at
    const activeKeys = await this.dataSource.query(
      `SELECT * FROM public.license_keys WHERE firm_id = $1 AND status = 'ACTIVE' ORDER BY expires_at DESC LIMIT 1`,
      [firm.id],
    );

    if (activeKeys.length > 0) {
      await this.dataSource.query(
        `UPDATE public.firms SET trial_ends_at = $1, status = 'ACTIVE', updated_at = NOW() WHERE id = $2`,
        [activeKeys[0].expires_at, firm.id],
      );
    } else {
      await this.dataSource.query(
        `UPDATE public.firms SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
        [firm.id],
      );
    }

    return { success: true, message: 'License key successfully revoked and deleted.' };
  }

  /**
   * Delete a transaction receipt
   */
  async deleteTransaction(idOrSlug: string, txId: string) {
    const firm = await this.resolveFirm(idOrSlug);

    // Check if it's in public.transactions
    await this.dataSource.query(
      `DELETE FROM public.transactions WHERE (id::text = $1 OR license_key_id::text = $1) AND firm_id = $2`,
      [txId, firm.id],
    );

    // Also remove from public.license_keys if matching keyId
    await this.dataSource.query(
      `DELETE FROM public.license_keys WHERE id::text = $1 AND firm_id = $2`,
      [txId, firm.id],
    );

    return { success: true, message: 'Transaction receipt successfully deleted.' };
  }

  /**
   * Get transaction and renewal receipt history for a firm with complete company & firm metadata
   */
  async getFirmTransactions(idOrSlug: string) {
    await this.ensureTransactionColumns();
    const firm = await this.resolveFirm(idOrSlug);
    const rows = await this.dataSource.query(
      `SELECT t.*, 
              COALESCE(t.duration_days, lk.duration_days, 1)::int as duration_days,
              COALESCE(t.expires_at, lk.expires_at, (t.paid_at + (COALESCE(t.duration_days, lk.duration_days, 1) || ' days')::interval)) as expires_at,
              COALESCE(lk.key_prefix, 'FIRM-' || UPPER(SUBSTRING(f.slug FROM 1 FOR 4))) as key_prefix,
              COALESCE(lk.issued_at, t.paid_at, t.created_at) as issued_at,
              COALESCE(t.is_renewal, lk.is_renewal, false) as is_renewal,
              f.title as firm_title, f.slug as firm_slug, f.tenant_name, f.domain, f.logo_url, f.firm_mode, f.level_type, f.theme_color
       FROM public.transactions t
       LEFT JOIN public.license_keys lk ON lk.id = t.license_key_id
       JOIN public.firms f ON f.id = t.firm_id
       WHERE t.firm_id = $1
       ORDER BY t.created_at DESC`,
      [firm.id],
    );

    // Fallback: If no explicit transactions recorded yet, synthesize receipts from issued license keys
    if (rows.length === 0) {
      const keys = await this.dataSource.query(
        `SELECT lk.id as license_key_id, lk.key_prefix, lk.duration_days, lk.amount, lk.issued_at, lk.expires_at, lk.is_renewal, lk.created_at,
                f.id as firm_id, f.title as firm_title, f.slug as firm_slug, f.tenant_name, f.domain, f.logo_url, f.firm_mode, f.level_type, f.theme_color
         FROM public.license_keys lk
         JOIN public.firms f ON f.id = lk.firm_id
         WHERE lk.firm_id = $1
         ORDER BY lk.created_at DESC`,
        [firm.id],
      );

      return keys.map((k: any, idx: number) => ({
        id: k.license_key_id,
        firm_id: k.firm_id,
        license_key_id: k.license_key_id,
        amount: k.amount || '250000.00',
        currency: 'INR',
        payment_method: 'NORNX Enterprise Billing / Direct Wire',
        transaction_ref: `NRX-${k.firm_slug.toUpperCase().slice(0, 4)}-${1001 + idx}`,
        status: 'SUCCESS',
        paid_at: k.issued_at || k.created_at,
        created_at: k.created_at,
        key_prefix: k.key_prefix,
        duration_days: k.duration_days || 1,
        issued_at: k.issued_at,
        expires_at: k.expires_at,
        is_renewal: k.is_renewal,
        firm_title: k.firm_title,
        firm_slug: k.firm_slug,
        tenant_name: k.tenant_name,
        domain: k.domain,
        logo_url: k.logo_url,
        firm_mode: k.firm_mode,
        level_type: k.level_type,
        theme_color: k.theme_color,
      }));
    }

    return rows;
  }
}
