// src/components/SearchableDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, Dropdown, Spinner } from 'react-bootstrap';
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
  const [isSearchMode, setIsSearchMode] = useState(false);
  const dropdownRef = useRef(null);
  
  // Find the selected item from items based on value
  const selectedItem = items && items.length > 0 && value 
    ? items.find(item => item[valueKey] === value) 
    : null;
  
  const displayText = selectedItem 
    ? getFormattedDisplayText(selectedItem, displayKey)
    : '';

  // Initialize filtered items
  useEffect(() => {
    if (items && items.length > 0) {
      setFilteredItems(items.slice(0, 20));
    } else {
      setFilteredItems([]);
    }
  }, [items]);

  // Filter items when search term changes
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
      // Search through specified keys
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some(key => {
          const value = item[key];
          return value && String(value).toLowerCase().includes(searchTermLower);
        });
      }

      // Search through display key
      const displayValue = item[displayKey];
      if (displayValue && String(displayValue).toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Search through extra display keys
      return extraDisplayKeys.some(key => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(searchTermLower);
      });
    });

    setFilteredItems(filtered.slice(0, 20));
  }, [searchTerm, items, displayKey, extraDisplayKeys, searchKeys]);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsSearchMode(false);
        setSearchTerm('');
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
    setIsSearchMode(false);
  };

  const handleFocus = () => {
    setIsSearchMode(true);
    setIsOpen(true);
  };

  return (
    <Form.Group className="mb-3 searchable-dropdown" ref={dropdownRef}>
      <Form.Label>{label}{required && <span className="text-danger">*</span>}</Form.Label>
      
      <div className="dropdown-container">
        {/* Only show the search input when in search mode */}
        {isSearchMode ? (
          <Form.Control
            type="text"
            placeholder={placeholder || `Search ${label}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            autoFocus
            autoComplete="off"
          />
        ) : (
          /* Display element that looks like an input but shows selected value */
          <div 
            className="form-control dropdown-display"
            onClick={handleFocus}
          >
            {displayText || placeholder || `Select ${label}...`}
          </div>
        )}

        {/* Dropdown menu */}
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
      </div>

      {/* Hidden form control for validation */}
      <Form.Control 
        type="hidden" 
        value={value || ''} 
        required={required} 
      />
    </Form.Group>
  );
};

export default SearchableDropdown;