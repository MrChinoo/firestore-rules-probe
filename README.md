# firestore-rules-probe

[![Tests](https://github.com/MrChinoo/firestore-rules-probe/actions/workflows/test.yml/badge.svg)](https://github.com/MrChinoo/firestore-rules-probe/actions/workflows/test.yml)

Tests your deployed Firestore rules through the live REST API. The emulator tells you what your rules file says. This tells you what the running project allows.

Node 20 or later. No dependencies. **Use it only on projects you own or are authorized to test.**

## Usage

```bash
# Can a stranger list these collections?
node probe.mjs --project my-project --key <webApiKey> --denied users,orders --public catalog

# Can any signed-in user list them?
node probe.mjs --project my-project --key <webApiKey> --denied users,orders --id-token <firebaseIdToken>
```

Sample output:

```text
Project my-project, anonymous

403   denied  users
200   denied  orders  EXPOSED (fields: email, total)
200   public  catalog

1 private collection(s) exposed.
```

The exit code is 2 when a private collection is exposed, so it can run in CI. For exposed collections it prints field names and never values.

## Why run both modes

A rule like `allow read: if request.auth != null` returns 403 to an anonymous probe and looks safe. Anyone who signs in with a Google account can still read everything. Run the second mode with an account that has no special role.

## Limits

It tests `list` on the collections you name. It doesn't test `get`, writes, subcollections or Storage.

A web API key identifies the project and isn't a secret. Rules are what protect your data.

## Tests

```bash
node --test
```
