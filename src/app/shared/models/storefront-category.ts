export interface StorefrontCategory {
  readonly id: number;
  readonly parentId: number | null;
  readonly name: string;
  readonly uniqueKey: string;
  readonly sortOrder: number;
  readonly children: readonly StorefrontCategory[];
}
