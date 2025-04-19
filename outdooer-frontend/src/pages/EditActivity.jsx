// src/components/SearchableDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Dropdown, Spinner } from 'react-bootstrap';
import '../styles/SearchableDropdown.css';

const getFormattedDisplayText = (item, displayKey) => {
  if (!item) return '';
  let display = '';
  if (item.country_code) display += item.country_code;
  if (item.region_code) display += display ? ', ' + item.region_code : item.region_code;
  if (item[displayKey]) display += display ? ', ' + item[displayKey] : item[displayKey];
  if (item.location_type) display += ` (${item.location_type})`;
  return display || 'Unknown location';
};

const SearchableDropdown = ({
  label,
  items,
  onSelect,
  value,
  valueKey,
  displayKey,
  extraDisplayKeys = [],
  placeholder,
  required = false,
  isLoading = false,
  searchKeys = [],
  noResultsMessage = 'No results found'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const dropdownRef = useRef(null);

  // Set selected label when value or items change
  useEffect(() => {
    if (!value || !items || items.length === 0) {
      setSelectedLabel('');
      return;
    }

    const selected = items.find(item => item[valueKey] === value);
    if (selected) {
      const newLabel = getFormattedDisplayText(selected, displayKey);
      if (newLabel !== selectedLabel) {
        setSelectedLabel(newLabel);
      }
    } else {
      if (selectedLabel !== '') setSelectedLabel('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items, valueKey, displayKey]);

  // Filter dropdown items
  useEffect(() => {
    if (!items || items.length === 0) {
      setFilteredItems([]);
      return;
    }

    if (searchTerm.trim() === '') {
      setFilteredItems(items.slice(0, 20));
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = items.filter(item => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some(key => {
          const value = item[key];
          return value && String(value).toLowerCase().includes(searchTermLower);
        });
      }

      const displayValue = item[displayKey];
      if (displayValue && String(displayValue).toLowerCase().includes(searchTermLower)) {
        return true;
      }

      return extraDisplayKeys.some(key => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(searchTermLower);
      });
    });

    setFilteredItems(filtered.slice(0, 20));
  }, [searchTerm, items, displayKey, extraDisplayKeys, searchKeys]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    onSelect(item[valueKey]);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <Form.Group className="mb-3 searchable-dropdown" ref={dropdownRef}>
      <Form.Label>{label}{required && <span className="text-danger">*</span>}</Form.Label>
      <InputGroup>
        <Form.Control
          type="text"
          placeholder={placeholder || `Search ${label}...`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onClick={() => setIsOpen(true)}
          autoComplete="off"
        />
        <div 
          className="selected-value-display" 
          onClick={() => setIsOpen(true)}
        >
          {selectedLabel || placeholder || `Select ${label}...`}
        </div>
      </InputGroup>

      <Dropdown show={isOpen} className="w-100">
        <Dropdown.Menu className="w-100">
          {isLoading ? (
            <div className="text-center p-2">
              <Spinner animation="border" size="sm" /> Loading...
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <Dropdown.Item 
                key={`${item[valueKey] || 'item'}-${index}`}
                onClick={() => handleSelect(item)}
                active={value === item[valueKey]}
              >
                {getFormattedDisplayText(item, displayKey)}
              </Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item disabled>{noResultsMessage}</Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>

      <Form.Control 
        type="hidden" 
        value={value || ''} 
        required={required} 
      />
    </Form.Group>
  );
};

export default SearchableDropdown;
