# Expense Tracker CLI

A small Python command-line app for recording and reviewing expenses. It uses
only Python's standard library; you do not need to install packages.

## Run it

Open the Shell, then run:

```bash
cd expense-tracker
python expense_tracker.py --help
```

Try the commands:

```bash
python expense_tracker.py add --description "Lunch" --amount 20
python expense_tracker.py add --description "Coffee" --amount 4.75
python expense_tracker.py list
python expense_tracker.py summary
python expense_tracker.py summary --month 11
python expense_tracker.py update --id 1 --amount 22.50
python expense_tracker.py update --id 2 --description "Tea"
python expense_tracker.py delete --id 2
```

The app creates `expenses.json` in the directory where you run it. The file is
plain text JSON, so you can open it and see how the records are stored. The
month summary uses the current year and month numbers from 1 through 12.

## Learn it in stages

The code is in `expense_tracker.py`. Follow the sections below from top to
bottom, and run one command after each stage.

### 1. Start with the data shape

One expense is a dictionary with four fields:

```python
{
    "id": 1,
    "date": "2026-11-03",
    "description": "Lunch",
    "amount_cents": 2000
}
```

The app keeps several dictionaries in a list. We save that list as JSON. Notice
that money is an integer number of cents, not a floating-point number such as
`20.00`. Integers keep addition exact: 2000 cents plus 475 cents is 2475 cents.

**Try it:** Open `expenses.json` after adding an expense. Find the four fields.

### 2. Understand the command line

`build_parser()` uses Python's `argparse` library to describe commands and
options. For example, `add` is a command, and `--description` and `--amount`
are options. Marking an option `required=True` makes Python show a useful error
if it is missing.

Run `python expense_tracker.py --help` and
`python expense_tracker.py add --help` to see the help text generated from this
function.

**Try it:** Remove `--amount` from an `add` command. Read the error message.

### 3. Validate and store money

`parse_amount()` runs whenever `argparse` reads an `--amount` option. It uses
`Decimal` to parse dollars, rejects zero and negative values, and converts the
valid amount to cents. The `type=parse_amount` setting connects the parser to
that function.

**Try it:** Run an add command with `--amount -2`, then try `--amount 2.999`.
Both should be rejected before any data is saved.

### 4. Load and save JSON

`load_expenses()` returns an empty list the first time, because the data file
does not exist yet. Otherwise, it reads the JSON list. `save_expenses()` writes
the updated list back to disk.

This read-change-save pattern is the app's persistence layer:

1. Read the current list.
2. Change it in memory.
3. Save the list.

If the JSON file is malformed, the app reports an error instead of silently
replacing it.

**Try it:** Make a backup copy of `expenses.json`, then temporarily change its
contents to `{}`. Run `list` and read the validation error. Restore the backup.

### 5. Add, find, and display records

`add_expense()` creates a record and chooses the next ID. `find_expense()`
searches by ID. `print_expenses()` formats the list into columns.

These functions focus on one job each. For example, `find_expense()` does not
print anything; it either returns a record or returns `None`. The caller
decides what to do next.

**Try it:** Add two records, list them, and compare their IDs and dates.

### 6. Update and delete

The `update` branch changes only the fields the user supplied. The `delete`
branch finds a record and removes it from the list. Both save the changed list
after the operation.

**Try it:** Update only a description, then update only an amount. Try updating
an ID that is not in the list and notice how the app responds.

### 7. Calculate summaries

The `summary` branch adds `amount_cents` values with `sum()`. If `--month` is
provided, a list comprehension keeps only expenses dated in that month of the
current year. `format_money()` turns the integer-cent total back into dollars
for display.

**Try it:** Run `summary --month 13`, then try a valid month with no expenses.

## A useful mental model

The program has three layers:

1. **Input:** `argparse` reads commands and validates their shape.
2. **Logic:** functions add, find, format, and total expenses.
3. **Storage and output:** JSON preserves data; `print()` shows results.

Keeping these responsibilities distinct makes it easier to add features
without putting all the logic into one large command handler.

## Next exercises

1. Add an optional category field, such as `food` or `transport`.
2. Add `--category` to `list` so users can filter results.
3. Add a budget file and warn when the monthly total exceeds the budget.
4. Add an `export` command that writes the list to a CSV file with Python's
   built-in `csv` module.
