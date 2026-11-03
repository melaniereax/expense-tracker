"""A small command-line expense tracker.

Run `python expense_tracker.py --help` to see the available commands.
Expenses are saved in expenses.json in the current working directory.
"""

import argparse
import json
import sys
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path


DATA_FILE = Path("expenses.json")


def parse_amount(text: str) -> int:
    """Turn a positive dollar amount such as '12.50' into integer cents."""
    try:
        amount = Decimal(text)
    except InvalidOperation as error:
        raise argparse.ArgumentTypeError("amount must be a number, such as 12.50") from error

    if not amount.is_finite():
        raise argparse.ArgumentTypeError("amount must be a finite number")
    if amount <= 0:
        raise argparse.ArgumentTypeError("amount must be greater than zero")

    cents = amount * 100
    if cents != cents.to_integral_value():
        raise argparse.ArgumentTypeError("amount can have at most two decimal places")

    return int(cents)


def load_expenses() -> list[dict]:
    """Read saved expenses, or start with an empty list on the first run."""
    if not DATA_FILE.exists():
        return []

    try:
        with DATA_FILE.open(encoding="utf-8") as file:
            expenses = json.load(file)
    except json.JSONDecodeError as error:
        raise ValueError(f"{DATA_FILE} is not valid JSON; it was left unchanged") from error

    if not isinstance(expenses, list):
        raise ValueError(f"{DATA_FILE} must contain a JSON list")
    return expenses


def save_expenses(expenses: list[dict]) -> None:
    """Write the full list back to the JSON file."""
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(expenses, file, indent=2)
        file.write("\n")


def format_money(cents: int) -> str:
    """Display integer cents as dollars and cents."""
    return f"${cents // 100}.{cents % 100:02d}"


def add_expense(expenses: list[dict], description: str, amount_cents: int) -> int:
    """Create an expense and return its new ID."""
    next_id = max((expense["id"] for expense in expenses), default=0) + 1
    expenses.append(
        {
            "id": next_id,
            "date": date.today().isoformat(),
            "description": description,
            "amount_cents": amount_cents,
        }
    )
    return next_id


def find_expense(expenses: list[dict], expense_id: int) -> dict | None:
    """Find one expense by ID, returning None if it does not exist."""
    return next((expense for expense in expenses if expense["id"] == expense_id), None)


def print_expenses(expenses: list[dict]) -> None:
    """Print a simple table of expenses."""
    if not expenses:
        print("No expenses yet. Add one with the 'add' command.")
        return

    print(f"{'ID':<5}{'Date':<12}{'Description':<28}{'Amount':>10}")
    for expense in sorted(expenses, key=lambda item: item["id"]):
        print(
            f"{expense['id']:<5}"
            f"{expense['date']:<12}"
            f"{expense['description']:<28}"
            f"{format_money(expense['amount_cents']):>10}"
        )


def build_parser() -> argparse.ArgumentParser:
    """Describe the command-line interface and its arguments."""
    parser = argparse.ArgumentParser(
        prog="expense-tracker",
        description="Add, update, delete, and summarize your expenses.",
    )
    commands = parser.add_subparsers(dest="command")

    add_parser = commands.add_parser("add", help="add a new expense")
    add_parser.add_argument("--description", required=True, help="what the expense was for")
    add_parser.add_argument("--amount", required=True, type=parse_amount, help="amount in dollars")

    update_parser = commands.add_parser("update", help="change an existing expense")
    update_parser.add_argument("--id", required=True, type=int, help="expense ID")
    update_parser.add_argument("--description", help="new description")
    update_parser.add_argument("--amount", type=parse_amount, help="new amount in dollars")

    delete_parser = commands.add_parser("delete", help="remove an expense")
    delete_parser.add_argument("--id", required=True, type=int, help="expense ID")

    commands.add_parser("list", help="show all expenses")

    summary_parser = commands.add_parser("summary", help="show expense totals")
    summary_parser.add_argument(
        "--month",
        type=int,
        choices=range(1, 13),
        metavar="1-12",
        help="show only this month of the current year",
    )
    return parser


def run(args: argparse.Namespace, parser: argparse.ArgumentParser) -> None:
    """Choose the requested operation and save changes when necessary."""
    if args.command is None:
        parser.print_help()
        return

    expenses = load_expenses()

    if args.command == "add":
        description = args.description.strip()
        if not description:
            parser.error("description cannot be blank")
        expense_id = add_expense(expenses, description, args.amount)
        save_expenses(expenses)
        print(f"Expense added successfully (ID: {expense_id})")

    elif args.command == "update":
        if args.description is None and args.amount is None:
            parser.error("provide --description, --amount, or both")
        expense = find_expense(expenses, args.id)
        if expense is None:
            parser.error(f"expense with ID {args.id} does not exist")
        if args.description is not None:
            description = args.description.strip()
            if not description:
                parser.error("description cannot be blank")
            expense["description"] = description
        if args.amount is not None:
            expense["amount_cents"] = args.amount
        save_expenses(expenses)
        print(f"Expense {args.id} updated successfully")

    elif args.command == "delete":
        expense = find_expense(expenses, args.id)
        if expense is None:
            parser.error(f"expense with ID {args.id} does not exist")
        expenses.remove(expense)
        save_expenses(expenses)
        print(f"Expense {args.id} deleted successfully")

    elif args.command == "list":
        print_expenses(expenses)

    elif args.command == "summary":
        current_year = date.today().year
        matching = expenses
        heading = "Total expenses"

        if args.month is not None:
            matching = [
                expense
                for expense in expenses
                if date.fromisoformat(expense["date"]).year == current_year
                and date.fromisoformat(expense["date"]).month == args.month
            ]
            month_name = date(current_year, args.month, 1).strftime("%B")
            heading = f"Total expenses for {month_name}"

        total_cents = sum(expense["amount_cents"] for expense in matching)
        print(f"{heading}: {format_money(total_cents)}")


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        run(args, parser)
    except (OSError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
