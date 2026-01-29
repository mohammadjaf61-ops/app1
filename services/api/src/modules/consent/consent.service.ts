import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { RecordConsentDto, ConsentDocumentType } from './dto';

/**
 * Current document versions
 * Update these when legal documents are updated
 */
export const CURRENT_DOCUMENT_VERSIONS: Record<ConsentDocumentType, string> = {
  TERMS_OF_SERVICE: '1.0',
  PRIVACY_POLICY: '1.0',
  RETURN_REFUND: '1.0',
};

/**
 * Required documents for order placement
 */
export const REQUIRED_DOCUMENTS: ConsentDocumentType[] = [
  ConsentDocumentType.TERMS_OF_SERVICE,
  ConsentDocumentType.PRIVACY_POLICY,
];

export interface AcceptedDocument {
  documentType: string;
  version: string;
  acceptedAt: Date;
  isCurrent: boolean;
}

export interface ConsentStatus {
  hasAcceptedAll: boolean;
  acceptedDocuments: AcceptedDocument[];
  missingDocuments: ConsentDocumentType[];
}

export interface DocumentTypeCount {
  documentType: string;
  count: number;
}

export interface DailyConsentCount {
  date: string;
  count: number;
}

export interface ConsentStats {
  totalConsents: number;
  uniqueCustomers: number;
  byDocumentType: DocumentTypeCount[];
  recentConsents: DailyConsentCount[];
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record user consent for legal documents
   */
  async recordConsent(
    dto: RecordConsentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ recorded: number; documents: string[] }> {
    const recordedDocuments: string[] = [];

    for (const docType of dto.documentTypes) {
      const documentType = docType as unknown as ConsentDocumentType;

      try {
        await this.prisma.userConsent.upsert({
          where: {
            customerPhone_documentType_version: {
              customerPhone: dto.phone,
              documentType,
              version: dto.version,
            },
          },
          update: {
            // Update timestamp if re-accepting same version
            acceptedAt: new Date(),
            ipAddress,
            userAgent,
          },
          create: {
            customerPhone: dto.phone,
            documentType,
            version: dto.version,
            ipAddress,
            userAgent,
          },
        });

        recordedDocuments.push(docType);
      } catch (error) {
        this.logger.error(
          `Failed to record consent for ${docType}: ${dto.phone}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log(`Consent recorded for ${dto.phone}: ${recordedDocuments.length} documents`);

    return {
      recorded: recordedDocuments.length,
      documents: recordedDocuments,
    };
  }

  /**
   * Check if user has accepted all required documents
   */
  async checkConsent(phone: string): Promise<ConsentStatus> {
    // Type for the consent record from database
    interface ConsentRecord {
      documentType: string;
      version: string;
      acceptedAt: Date;
    }

    const consents = (await this.prisma.userConsent.findMany({
      where: { customerPhone: phone },
      orderBy: { acceptedAt: 'desc' },
    })) as ConsentRecord[];

    const acceptedDocuments: AcceptedDocument[] = consents.map((consent: ConsentRecord) => ({
      documentType: consent.documentType,
      version: consent.version,
      acceptedAt: consent.acceptedAt,
      isCurrent:
        consent.version ===
        CURRENT_DOCUMENT_VERSIONS[consent.documentType as ConsentDocumentType],
    }));

    // Find missing required documents
    const acceptedTypes = new Set(
      acceptedDocuments
        .filter((d: AcceptedDocument) => d.isCurrent)
        .map((d: AcceptedDocument) => d.documentType),
    );

    const missingDocuments = REQUIRED_DOCUMENTS.filter(
      (doc) => !acceptedTypes.has(doc),
    );

    return {
      hasAcceptedAll: missingDocuments.length === 0,
      acceptedDocuments,
      missingDocuments,
    };
  }

  /**
   * Check if phone has given required consent (for order validation)
   */
  async hasRequiredConsent(phone: string): Promise<boolean> {
    const status = await this.checkConsent(phone);
    return status.hasAcceptedAll;
  }

  /**
   * Get consent statistics for admin dashboard
   */
  async getConsentStats(): Promise<ConsentStats> {
    // Total consents
    const totalConsents = await this.prisma.userConsent.count();

    // Unique customers
    const uniqueCustomersResult = await this.prisma.userConsent.groupBy({
      by: ['customerPhone'],
    });
    const uniqueCustomers = uniqueCustomersResult.length;

    // By document type
    interface TypeCountResult {
      documentType: string;
      _count: { id: number };
    }
    const byTypeResult = (await this.prisma.userConsent.groupBy({
      by: ['documentType'],
      _count: { id: true },
    })) as TypeCountResult[];
    const byDocumentType: DocumentTypeCount[] = byTypeResult.map(
      (r: TypeCountResult) => ({
        documentType: r.documentType,
        count: r._count.id,
      }),
    );

    // Recent consents (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentConsentsRaw = await this.prisma.userConsent.findMany({
      where: {
        acceptedAt: { gte: sevenDaysAgo },
      },
      select: { acceptedAt: true },
      orderBy: { acceptedAt: 'asc' },
    });

    // Group by date
    const byDate = new Map<string, number>();
    for (const consent of recentConsentsRaw) {
      const dateStr = consent.acceptedAt.toISOString().split('T')[0];
      byDate.set(dateStr, (byDate.get(dateStr) || 0) + 1);
    }

    const recentConsents = Array.from(byDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      totalConsents,
      uniqueCustomers,
      byDocumentType,
      recentConsents,
    };
  }

  /**
   * Get current document versions
   */
  getCurrentVersions(): Record<ConsentDocumentType, string> {
    return { ...CURRENT_DOCUMENT_VERSIONS };
  }
}
