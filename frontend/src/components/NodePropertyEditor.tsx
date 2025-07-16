import React, { useState, useEffect } from "react";

interface PropertyValue {
  type:
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object"
    | "select"
    | "color"
    | "file";
  value: any;
  label: string;
  description?: string;
  required?: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface PropertySchema {
  [key: string]: PropertyValue;
}

interface NodePropertyEditorProps {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  properties: PropertySchema;
  onPropertiesChange: (properties: PropertySchema) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const NodePropertyEditor: React.FC<NodePropertyEditorProps> = ({
  nodeId,
  nodeName,
  nodeType,
  properties: initialProperties,
  onPropertiesChange,
  onSave,
  onCancel,
  readOnly = false,
}) => {
  const [properties, setProperties] =
    useState<PropertySchema>(initialProperties);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setProperties(initialProperties);
    setIsDirty(false);
    setErrors({});
  }, [initialProperties]);

  const validateProperty = (property: PropertyValue): string | null => {
    const { value, required, validation } = property;

    // Required validation
    if (required && (value === null || value === undefined || value === "")) {
      return `${property.label} is required`;
    }

    // Type-specific validation
    if (value !== null && value !== undefined && value !== "") {
      switch (property.type) {
        case "number":
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return `${property.label} must be a valid number`;
          }
          if (validation?.min !== undefined && numValue < validation.min) {
            return `${property.label} must be at least ${validation.min}`;
          }
          if (validation?.max !== undefined && numValue > validation.max) {
            return `${property.label} must be at most ${validation.max}`;
          }
          break;

        case "string":
          if (validation?.pattern) {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
              return (
                validation.message || `${property.label} format is invalid`
              );
            }
          }
          if (validation?.min !== undefined && value.length < validation.min) {
            return `${property.label} must be at least ${validation.min} characters`;
          }
          if (validation?.max !== undefined && value.length > validation.max) {
            return `${property.label} must be at most ${validation.max} characters`;
          }
          break;

        case "array":
          if (validation?.min !== undefined && value.length < validation.min) {
            return `${property.label} must have at least ${validation.min} items`;
          }
          if (validation?.max !== undefined && value.length > validation.max) {
            return `${property.label} must have at most ${validation.max} items`;
          }
          break;
      }
    }

    return null;
  };

  const handlePropertyChange = (key: string, newValue: any) => {
    if (readOnly) return;

    const updatedProperties = {
      ...properties,
      [key]: {
        ...properties[key],
        value: newValue,
      },
    };

    setProperties(updatedProperties);
    setIsDirty(true);

    // Validate the changed property
    const error = validateProperty(updatedProperties[key]);
    setErrors((prev) => ({
      ...prev,
      [key]: error || "",
    }));

    onPropertiesChange(updatedProperties);
  };

  const handleAddArrayItem = (key: string) => {
    const currentArray = properties[key].value || [];
    handlePropertyChange(key, [...currentArray, ""]);
  };

  const handleRemoveArrayItem = (key: string, index: number) => {
    const currentArray = properties[key].value || [];
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    handlePropertyChange(key, newArray);
  };

  const handleArrayItemChange = (key: string, index: number, value: any) => {
    const currentArray = properties[key].value || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handlePropertyChange(key, newArray);
  };

  const handleObjectPropertyChange = (
    key: string,
    objectKey: string,
    value: any
  ) => {
    const currentObject = properties[key].value || {};
    const newObject = {
      ...currentObject,
      [objectKey]: value,
    };
    handlePropertyChange(key, newObject);
  };

  const renderPropertyInput = (key: string, property: PropertyValue) => {
    const { type, value, options } = property;
    const hasError = errors[key];

    switch (type) {
      case "string":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            disabled={readOnly}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasError ? "border-red-300" : "border-gray-300"
            } ${readOnly ? "bg-gray-50" : ""}`}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            disabled={readOnly}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasError ? "border-red-300" : "border-gray-300"
            } ${readOnly ? "bg-gray-50" : ""}`}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handlePropertyChange(key, e.target.checked)}
              disabled={readOnly}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              {value ? "Enabled" : "Disabled"}
            </label>
          </div>
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            disabled={readOnly}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasError ? "border-red-300" : "border-gray-300"
            } ${readOnly ? "bg-gray-50" : ""}`}
          >
            <option value="">Select an option</option>
            {options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "color":
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
              disabled={readOnly}
              className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value || ""}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
              disabled={readOnly}
              className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                hasError ? "border-red-300" : "border-gray-300"
              } ${readOnly ? "bg-gray-50" : ""}`}
              placeholder="#000000"
            />
          </div>
        );

      case "array":
        const arrayValue = value || [];
        return (
          <div className="space-y-2">
            {arrayValue.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    handleArrayItemChange(key, index, e.target.value)
                  }
                  disabled={readOnly}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Item ${index + 1}`}
                />
                {!readOnly && (
                  <button
                    onClick={() => handleRemoveArrayItem(key, index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <button
                onClick={() => handleAddArrayItem(key)}
                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Item
              </button>
            )}
          </div>
        );

      case "object":
        const objectValue = value || {};
        return (
          <div className="space-y-2">
            {Object.entries(objectValue).map(([objKey, objValue]) => (
              <div key={objKey} className="flex items-center gap-2">
                <input
                  type="text"
                  value={objKey}
                  disabled={readOnly}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  placeholder="Key"
                />
                <input
                  type="text"
                  value={objValue as string}
                  onChange={(e) =>
                    handleObjectPropertyChange(key, objKey, e.target.value)
                  }
                  disabled={readOnly}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Value"
                />
              </div>
            ))}
            <div className="text-xs text-gray-500">
              Object properties can be edited as key-value pairs
            </div>
          </div>
        );

      default:
        return (
          <textarea
            value={
              typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : value || ""
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handlePropertyChange(key, parsed);
              } catch {
                handlePropertyChange(key, e.target.value);
              }
            }}
            disabled={readOnly}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
              hasError ? "border-red-300" : "border-gray-300"
            } ${readOnly ? "bg-gray-50" : ""}`}
            rows={4}
          />
        );
    }
  };

  const hasErrors = Object.values(errors).some((error) => error);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{nodeName}</h3>
          <p className="text-sm text-gray-600">
            {nodeType} • Node ID: {nodeId}
          </p>
          {isDirty && !readOnly && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Unsaved changes</p>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            {onSave && (
              <button
                onClick={onSave}
                disabled={hasErrors}
                className={`px-3 py-1 rounded ${
                  hasErrors
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Save
              </button>
            )}
          </div>
        )}
      </div>

      {/* Properties */}
      <div className="space-y-6">
        {Object.entries(properties).map(([key, property]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {property.label}
              {property.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>

            {property.description && (
              <p className="text-xs text-gray-500">{property.description}</p>
            )}

            {renderPropertyInput(key, property)}

            {errors[key] && (
              <p className="text-xs text-red-600">{errors[key]}</p>
            )}
          </div>
        ))}
      </div>

      {Object.keys(properties).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⚙️</div>
          <p>No properties configured for this node</p>
        </div>
      )}
    </div>
  );
};
