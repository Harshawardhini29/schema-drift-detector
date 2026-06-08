def compute_diff(previous: dict, current: dict) -> dict:
    changes = []

    prev_tables = set(previous.keys())
    curr_tables = set(current.keys())

    for table in curr_tables - prev_tables:
        changes.append({"type": "table_added", "table": table, "detail": None})

    for table in prev_tables - curr_tables:
        changes.append({"type": "table_removed", "table": table, "detail": None})

    for table in prev_tables & curr_tables:
        prev_cols = previous[table]["columns"]
        curr_cols = current[table]["columns"]

        for col in set(curr_cols) - set(prev_cols):
            changes.append({
                "type": "column_added",
                "table": table,
                "detail": {"column": col, "new_type": curr_cols[col]["type"]},
            })

        for col in set(prev_cols) - set(curr_cols):
            changes.append({
                "type": "column_removed",
                "table": table,
                "detail": {"column": col, "old_type": prev_cols[col]["type"]},
            })

        for col in set(prev_cols) & set(curr_cols):
            if prev_cols[col]["type"] != curr_cols[col]["type"]:
                changes.append({
                    "type": "column_type_changed",
                    "table": table,
                    "detail": {
                        "column": col,
                        "old_type": prev_cols[col]["type"],
                        "new_type": curr_cols[col]["type"],
                    },
                })
            if prev_cols[col].get("nullable") != curr_cols[col].get("nullable"):
                changes.append({
                    "type": "nullable_changed",
                    "table": table,
                    "detail": {
                        "column": col,
                        "old_nullable": prev_cols[col].get("nullable"),
                        "new_nullable": curr_cols[col].get("nullable"),
                    },
                })

        prev_pks = set(previous[table].get("primary_keys", []))
        curr_pks = set(current[table].get("primary_keys", []))
        if prev_pks != curr_pks:
            changes.append({
                "type": "primary_key_changed",
                "table": table,
                "detail": {"old_pks": list(prev_pks), "new_pks": list(curr_pks)},
            })

    return {"total_changes": len(changes), "changes": changes}
