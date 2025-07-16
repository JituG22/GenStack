# Node Types Documentation

## Overview

GenStack supports various node types that represent different components, APIs, database operations, and CI/CD steps. Each node type has a specific template structure, property schema, and validation rules.

## Node Type Categories

### 1. Frontend Components

#### React Component Node

**Type**: `react`
**Category**: `frontend`

**Template Structure:**

```javascript
import React from 'react';
{{#if imports}}
{{imports}}
{{/if}}

const {{componentName}} = ({{#if props}}{{props}}{{else}}{}{{/if}}) => {
  {{#if state}}
  {{state}}
  {{/if}}

  {{#if effects}}
  {{effects}}
  {{/if}}

  {{#if handlers}}
  {{handlers}}
  {{/if}}

  return (
    {{jsx}}
  );
};

export default {{componentName}};
```

**Properties Schema:**

```json
{
  "componentName": {
    "type": "string",
    "required": true,
    "validation": "^[A-Z][a-zA-Z0-9]*$",
    "description": "Component name (PascalCase)"
  },
  "props": {
    "type": "string",
    "required": false,
    "default": "{}",
    "description": "Component props destructuring"
  },
  "jsx": {
    "type": "textarea",
    "required": true,
    "default": "<div>Hello World</div>",
    "description": "JSX return content"
  },
  "imports": {
    "type": "textarea",
    "required": false,
    "description": "Additional imports"
  },
  "state": {
    "type": "textarea",
    "required": false,
    "description": "React hooks and state"
  },
  "effects": {
    "type": "textarea",
    "required": false,
    "description": "useEffect hooks"
  },
  "handlers": {
    "type": "textarea",
    "required": false,
    "description": "Event handlers"
  }
}
```

**Example Output:**

```javascript
import React, { useState, useEffect } from "react";

const UserCard = ({ user, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log("User card mounted");
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
    onEdit(user.id);
  };

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={handleEditClick}>Edit</button>
    </div>
  );
};

export default UserCard;
```

#### Angular Component Node

**Type**: `angular`
**Category**: `frontend`

**Template Structure:**

```typescript
import { Component{{#if imports}}, {{imports}}{{/if}} } from '@angular/core';

@Component({
  selector: '{{selector}}',
  template: `{{template}}`,
  {{#if styles}}
  styles: [`{{styles}}`]
  {{/if}}
})
export class {{componentName}} {
  {{#if properties}}
  {{properties}}
  {{/if}}

  {{#if methods}}
  {{methods}}
  {{/if}}
}
```

### 2. Backend APIs

#### Node.js API Endpoint

**Type**: `nodejs-api`
**Category**: `backend`

**Template Structure:**

```javascript
{{#if imports}}
{{imports}}
{{/if}}

const {{handlerName}} = async (req, res) => {
  try {
    {{#if middleware}}
    // Middleware
    {{middleware}}
    {{/if}}

    {{#if validation}}
    // Validation
    {{validation}}
    {{/if}}

    // Handler logic
    {{handlerLogic}}

    res.status({{successStatus}}).json({
      success: true,
      data: {{responseData}},
      message: '{{successMessage}}'
    });
  } catch (error) {
    console.error('{{handlerName}} error:', error);
    res.status({{errorStatus}}).json({
      success: false,
      message: error.message || '{{errorMessage}}'
    });
  }
};

module.exports = {{handlerName}};
```

**Properties Schema:**

```json
{
  "handlerName": {
    "type": "string",
    "required": true,
    "validation": "^[a-zA-Z][a-zA-Z0-9]*$",
    "description": "Handler function name"
  },
  "method": {
    "type": "select",
    "options": ["GET", "POST", "PUT", "DELETE", "PATCH"],
    "required": true,
    "default": "GET",
    "description": "HTTP method"
  },
  "path": {
    "type": "string",
    "required": true,
    "validation": "^/[a-zA-Z0-9/_-]*$",
    "description": "API endpoint path"
  },
  "handlerLogic": {
    "type": "textarea",
    "required": true,
    "description": "Main handler logic"
  },
  "validation": {
    "type": "textarea",
    "required": false,
    "description": "Request validation logic"
  },
  "middleware": {
    "type": "textarea",
    "required": false,
    "description": "Middleware functions"
  },
  "successStatus": {
    "type": "number",
    "default": 200,
    "description": "Success status code"
  },
  "errorStatus": {
    "type": "number",
    "default": 500,
    "description": "Error status code"
  },
  "responseData": {
    "type": "string",
    "default": "result",
    "description": "Response data variable"
  },
  "successMessage": {
    "type": "string",
    "default": "Operation successful",
    "description": "Success message"
  },
  "errorMessage": {
    "type": "string",
    "default": "Internal server error",
    "description": "Error message"
  }
}
```

#### Python FastAPI Endpoint

**Type**: `python-api`
**Category**: `backend`

**Template Structure:**

```python
from fastapi import APIRouter, HTTPException{{#if imports}}, {{imports}}{{/if}}
{{#if models}}
from pydantic import BaseModel
{{models}}
{{/if}}

router = APIRouter()

@router.{{method}}("{{path}}")
async def {{functionName}}({{parameters}}):
    """
    {{description}}
    """
    try:
        {{#if validation}}
        # Validation
        {{validation}}
        {{/if}}

        # Handler logic
        {{handlerLogic}}

        return {
            "success": True,
            "data": {{responseData}},
            "message": "{{successMessage}}"
        }
    except Exception as e:
        raise HTTPException(
            status_code={{errorStatus}},
            detail=str(e)
        )
```

### 3. Database Operations

#### MongoDB Query Node

**Type**: `mongodb`
**Category**: `database`

**Template Structure:**

```javascript
const {{operationName}} = async ({{parameters}}) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('{{collectionName}}');

    {{#if operation === 'find'}}
    const result = await collection.find({{query}}){{#if sort}}.sort({{sort}}){{/if}}{{#if limit}}.limit({{limit}}){{/if}}.toArray();
    {{/if}}

    {{#if operation === 'findOne'}}
    const result = await collection.findOne({{query}});
    {{/if}}

    {{#if operation === 'insertOne'}}
    const result = await collection.insertOne({{document}});
    {{/if}}

    {{#if operation === 'updateOne'}}
    const result = await collection.updateOne({{query}}, {{update}});
    {{/if}}

    {{#if operation === 'deleteOne'}}
    const result = await collection.deleteOne({{query}});
    {{/if}}

    return result;
  } catch (error) {
    throw new Error(`{{operationName}} failed: ${error.message}`);
  }
};
```

#### PostgreSQL Query Node

**Type**: `postgresql`
**Category**: `database`

**Template Structure:**

```javascript
const {{queryName}} = async ({{parameters}}) => {
  const client = await pool.connect();

  try {
    {{#if transaction}}
    await client.query('BEGIN');
    {{/if}}

    const query = `{{sqlQuery}}`;
    const values = [{{queryValues}}];

    const result = await client.query(query, values);

    {{#if transaction}}
    await client.query('COMMIT');
    {{/if}}

    return result.rows;
  } catch (error) {
    {{#if transaction}}
    await client.query('ROLLBACK');
    {{/if}}
    throw error;
  } finally {
    client.release();
  }
};
```

### 4. Form Elements

#### Input Field Node

**Type**: `form-input`
**Category**: `forms`

**Template Structure:**

```javascript
import React from 'react';

const {{componentName}} = ({
  value,
  onChange,
  label,
  error,
  required = {{required}},
  disabled = false,
  placeholder = '{{placeholder}}',
  ...props
}) => {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type="{{inputType}}"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`form-input ${error ? 'error' : ''}`}
        {{#if validation}}
        {{validation}}
        {{/if}}
        {...props}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default {{componentName}};
```

### 5. CI/CD Operations

#### GitHub Action Step

**Type**: `github-action`
**Category**: `cicd`

**Template Structure:**

```yaml
- name: {{stepName}}
  {{#if condition}}
  if: {{condition}}
  {{/if}}
  {{#if useAction}}
  uses: {{actionName}}@{{actionVersion}}
  {{else}}
  run: {{command}}
  {{/if}}
  {{#if workingDirectory}}
  working-directory: {{workingDirectory}}
  {{/if}}
  {{#if inputs}}
  with:
{{inputs}}
  {{/if}}
  {{#if environment}}
  env:
{{environment}}
  {{/if}}
```

#### Docker Build Step

**Type**: `docker-build`
**Category**: `cicd`

**Template Structure:**

```yaml
- name: { { stepName } }
  run: |
    docker build \
      -t {{imageName}}:{{tag}} \
      {{#if buildArgs}}
      {{buildArgs}} \
      {{/if}}
      {{#if dockerfile}}
      -f {{dockerfile}} \
      {{/if}}
      {{buildContext}}

    {{#if push}}
    docker push {{imageName}}:{{tag}}
    {{/if}}
```

## Custom Node Creation

### Creating a Custom Node Type

1. **Define the Template Structure**

```javascript
const customTemplate = `
// Your template code here
// Use {{variableName}} for placeholders
`;
```

2. **Define Properties Schema**

```json
{
  "property1": {
    "type": "string|number|boolean|select|textarea",
    "required": true|false,
    "default": "defaultValue",
    "options": ["option1", "option2"], // for select type
    "validation": "regex pattern",
    "description": "Property description"
  }
}
```

3. **Define Validations**

```json
[
  {
    "field": "propertyName",
    "rule": "required|min|max|pattern|custom",
    "value": "ruleValue",
    "message": "Error message"
  }
]
```

### Node Property Types

| Type       | Description            | Example              |
| ---------- | ---------------------- | -------------------- |
| `string`   | Single line text input | `"Hello World"`      |
| `number`   | Numeric input          | `42`                 |
| `boolean`  | Checkbox               | `true`               |
| `select`   | Dropdown selection     | `"option1"`          |
| `textarea` | Multi-line text        | `"Line 1\nLine 2"`   |
| `json`     | JSON object input      | `{"key": "value"}`   |
| `array`    | Array input            | `["item1", "item2"]` |
| `file`     | File upload            | File object          |

### Validation Rules

| Rule       | Description                | Example                                       |
| ---------- | -------------------------- | --------------------------------------------- |
| `required` | Field must have a value    | `{"rule": "required"}`                        |
| `min`      | Minimum length/value       | `{"rule": "min", "value": 5}`                 |
| `max`      | Maximum length/value       | `{"rule": "max", "value": 100}`               |
| `pattern`  | Regex pattern              | `{"rule": "pattern", "value": "^[A-Z].*"}`    |
| `email`    | Valid email format         | `{"rule": "email"}`                           |
| `url`      | Valid URL format           | `{"rule": "url"}`                             |
| `custom`   | Custom validation function | `{"rule": "custom", "value": "functionName"}` |

## Node Testing

Each node type supports testing functionality:

### Test Configuration

```json
{
  "testConfig": {
    "timeout": 5000,
    "mockData": {
      "input1": "test value",
      "input2": 123
    },
    "expectedOutput": {
      "type": "object|string|number|boolean",
      "schema": {...}
    }
  }
}
```

### Test Execution

The system provides a sandboxed environment for testing nodes with:

- Mock database connections
- Simulated HTTP requests/responses
- Isolated execution context
- Performance monitoring
- Error logging

## Best Practices

### Template Design

1. Use clear placeholder names with descriptive comments
2. Include proper error handling
3. Follow language-specific conventions
4. Provide sensible defaults
5. Include validation and sanitization

### Property Schema

1. Use descriptive property names
2. Provide helpful descriptions
3. Set appropriate default values
4. Include proper validations
5. Group related properties

### Validation Rules

1. Validate all user inputs
2. Provide clear error messages
3. Use appropriate validation types
4. Consider security implications
5. Test edge cases

### Performance

1. Optimize template rendering
2. Minimize property complexity
3. Use efficient validation logic
4. Consider memory usage
5. Implement proper caching
