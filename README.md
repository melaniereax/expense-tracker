# Expense Tracker

A beginner-friendly project for learning how to record and manage expenses.
It includes a **Python command-line app** and a **React browser interface**.

## Project URL

This project implements the [roadmap.sh Expense Tracker project](https://roadmap.sh/projects/expense-tracker).

Project URL: https://roadmap.sh/projects/expense-tracker

Source code: https://github.com/melaniereax/expense-tracker

## Features

- Add expenses with a description and amount.
- View, update, and delete expenses.
- View the total of all expenses.
- View a monthly summary for the current year.
- Validate descriptions and positive amounts.
- Store amounts as integer cents to keep money calculations exact.

## Run the Python CLI

You need Python 3.10 or newer. No extra Python packages are required.

Clone this repository, then open its folder in VS Code:

```bash
git clone https://github.com/melaniereax/expense-tracker.git
cd expense-tracker
```

Open **Terminal → New Terminal** in VS Code, then enter the folder containing
the Python script:

```bash
cd expense-tracker
python3 expense_tracker.py --help
```

The repository and the Python subfolder are both named `expense-tracker`;
the second `cd expense-tracker` moves into the Python subfolder.
On Windows, use `py` instead of `python3` if needed.

### Example commands

Run these from the Python subfolder:

```bash
python3 expense_tracker.py add --description "Lunch" --amount 20
python3 expense_tracker.py add --description "Coffee" --amount 4.75
python3 expense_tracker.py list
python3 expense_tracker.py summary
python3 expense_tracker.py summary --month 11
python3 expense_tracker.py update --id 1 --amount 22.50
python3 expense_tracker.py delete --id 2
```

`--month` accepts numbers from 1 (January) through 12 (December).
Use the IDs printed by `add` or shown by `list` when updating or deleting.

## Browser interface

The browser app is in [`artifacts/expense-tracker-ui`](artifacts/expense-tracker-ui).
In Replit, open the **Expense Tracker** preview to use its forms and buttons.
You can add, edit, and delete records and review overall and monthly totals.

## Important: the two versions store data separately

- The **CLI** saves to `expenses.json` in the terminal's current folder.
  Run it from the Python subfolder consistently.
- The **browser app** saves to localStorage in the browser where you use it.
  Clearing browser storage removes those records.
- The two versions do **not** synchronize expenses.
- Personal expense records are excluded from this repository.

The GitHub repository URL is a link to the source code, not a live website URL.
Publishing the browser app on Replit is a separate step.

## Learn how it works

- [Python CLI walkthrough and exercises](expense-tracker/README.md)
- [Browser app learning guide](artifacts/expense-tracker-ui/LEARN.md)

### Main files

| File | Purpose |
| --- | --- |
| `expense-tracker/expense_tracker.py` | Python commands, calculations, and JSON storage |
| `artifacts/expense-tracker-ui/src/App.tsx` | Browser interface and React state |
| `artifacts/expense-tracker-ui/src/index.css` | Browser app styling |

Optional future exercises include expense categories, monthly budgets, and CSV
export. These features are not implemented yet.
