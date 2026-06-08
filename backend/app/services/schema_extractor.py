from sqlalchemy import create_engine, inspect


def extract_schema(connection_string: str) -> dict:
    engine = create_engine(connection_string)
    inspector = inspect(engine)
    schema = {}

    for table_name in inspector.get_table_names():
        columns = {}
        for col in inspector.get_columns(table_name):
            columns[col["name"]] = {
                "type": str(col["type"]),
                "nullable": col.get("nullable", True),
                "default": str(col.get("default")) if col.get("default") is not None else None,
            }
        pk = inspector.get_pk_constraint(table_name)
        fks = inspector.get_foreign_keys(table_name)
        indexes = inspector.get_indexes(table_name)

        schema[table_name] = {
            "columns": columns,
            "primary_keys": pk.get("constrained_columns", []),
            "foreign_keys": [
                {
                    "columns": fk["constrained_columns"],
                    "referred_table": fk["referred_table"],
                    "referred_columns": fk["referred_columns"],
                }
                for fk in fks
            ],
            "indexes": [{"name": idx["name"], "columns": idx["column_names"]} for idx in indexes],
        }

    engine.dispose()
    return schema
