# Little Ledger: a small tour

This is a one-page expense tracker. Everything lives in the browser, so there is no account or server to set up.

## Main files

- `src/App.tsx` contains the page, the expense form, the confirmation step for deleting, and the `/` route.
- `src/index.css` sets the colors, type, layout, and small-screen styles.
- `src/main.tsx` is the entry point that mounts the React app in the page.

## How the page remembers things

In `Home` inside `App.tsx`, `expenses` is React state: the current list the page displays. The first time the component starts, the `useState` initializer tries to read `little-ledger-expenses-v1` from `localStorage`. If nothing has been saved yet, the list starts empty. It does not create pretend expenses.

The `useEffect` below that state watches for changes to the list. Whenever an expense is added, edited, or removed, the effect saves the new list as JSON in localStorage. That storage belongs to this browser on this device; it is separate from any other program's files. If browser storage is unavailable, the page displays a small notice.

## Add, edit, and remove

The Add button opens the form with blank fields. The form checks that the description has text, the amount is a positive number, and the date is valid. Amounts are converted to integer cents before they are stored, so a value like `$4.25` is kept as `425`.

Each expense row has an edit button. It opens the same form with that expense's values filled in. Saving replaces that one item in the list. The remove button asks for confirmation first; choosing “Remove expense” filters that item out of the list.

The total is calculated from every saved expense. The monthly summary uses the month selector to sum only expenses from that month in the current year. These totals are calculated from state, not separately saved, so they update as soon as the list changes.

## React concepts in plain language

- **State** is the information React keeps between screen updates, such as the expense list and which month is selected.
- **Events** are the things that happen after a click or form submission. The handlers in `App.tsx` update state in response.
- **Effects** are work that happens after a render. Here, the effect keeps localStorage up to date with the expense list.
- **Memoized values** are totals and sorted lists that React recalculates when their inputs change.
