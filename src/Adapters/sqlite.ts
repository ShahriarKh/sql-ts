import { Knex } from 'knex'
import { TableDefinition, ColumnDefinition, EnumDefinition } from './AdapterInterface.js'
import { Config } from '../index.js'
import * as SharedAdapterTasks from './SharedAdapterTasks.js'

export default {
  async getAllEnums(db: Knex, config: Config): Promise<EnumDefinition[]> {
    return await SharedAdapterTasks.getTableEnums(db, config)
  },

  async getAllTables(db: Knex, schemas: string[]): Promise<TableDefinition[]> {
    const sql = `
      SELECT tbl_name from sqlite_master
      WHERE tbl_name <> 'sqlite_sequence'
      AND type IN ('table', 'view')
    `
    return (await db.raw(sql))
    .map((t: { tbl_name: string }) => ({ name: t.tbl_name, schema: 'main', comment: '' } as TableDefinition))
  },

  async getAllColumns(db: Knex, config: Config, table: string, schema: string): Promise<ColumnDefinition[]> {
    return (await db.raw(`pragma table_info(${table})`))
    .map((c: SQLiteColumn) => (
      {
        name: c.name,
        nullable: c.notnull === 0,
        type: (c.type.includes('(') ? c.type.split('(')[0] : c.type).toLowerCase(),
        optional: c.dflt_value !== null || c.notnull === 0 || c.pk !== 0,
        columnType: 'Standard',
        isPrimaryKey: c.pk !== 0,
        comment: '',
        defaultValue: c.dflt_value?.toString() ?? null,
      } as ColumnDefinition
    ))
  }
}

interface SQLiteColumn {
  name: string,
  type: string, 
  notnull: 0 | 1,
  dflt_value: string | null,
  pk: number
}