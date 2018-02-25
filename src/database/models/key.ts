import { Table, Column, Model } from "sequlize-typescript";

@Table
class BundleKeys extends Model<Key> {
  @Column
  @PrimaryKey
  @Unique
  @AllowNull(false)
  name: string,
  @Column
  @Unique
  @AllowNull(false)
  key: string
};
