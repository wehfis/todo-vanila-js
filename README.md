# todo-vanila-js

### As API is used "json-server" npm package, the structure of tasks is:
```
{
  "tasks": [
    {
      "id": "123",
      "title": "task1",
      "completed": false
    },
    {
      "id": "124",
      "title": "task2",
      "completed": true
    }
  ]
}
```
## To setup an local API:

### 1. Init npm project:

```
  npm init -y
```

### 2. Download "json-server" package:

```
  npm install json-server
```

### 3. Create file for storing data "db.json", and paste a tasks structure.

### 4. Run your local API:

```
  npx json-server db.json
```
Assuming that in **step 3** you've created "db.json" file.
