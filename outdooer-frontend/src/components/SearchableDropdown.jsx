// src/components/SearchableDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, Dropdown, Spinner } from 'react-bootstrap';
import '../styles/SearchableDropdown.css';

const getFormattedDisplayText = (item, displayKey, extraDisplayKeys = []) => {
  if (!item) return '';

  let display = item[displayKey] || '';

  if (extraDisplayKeys.length > 0) {
    const extras = extraDisplayKeys
      .map(key => item[key])
      .filter(Boolean)
      .join(', ');

    if (extras) {
      display = display ? `${display} (${extras})` : extras;
    }
  }

  return display || 'Unknown';
};

const SearchableDropdown = ({
  label,
  items = [],
  onSelect,
  value,
  valueKey = 'id',
  displayKey = 'name',
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

  const selectedItem = items.find(item => item[valueKey] === value);
  const displayText = selectedItem
    ? getFormattedDisplayText(selectedItem, displayKey, extraDisplayKeys)
    : '';

  // Inicializar o resetear lista filtrada
  useEffect(() => {
    if (items && items.length > 0) {
      setFilteredItems(items.slice(0, 20));
    } else {
      setFilteredItems([]);
    }
  }, [items]);

  // Filtro de búsqueda
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
      const allKeys = [...searchKeys, displayKey, ...extraDisplayKeys];
      return allKeys.some(key => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(searchTermLower);
      });
    });

    setFilteredItems(filtered.slice(0, 20));
  }, [searchTerm, items, displayKey, extraDisplayKeys, searchKeys]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsSearchMode(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          <div 
            className="form-control dropdown-display"
            onClick={handleFocus}
          >
            {displayText || placeholder || `Select ${label}...`}
          </div>
        )}

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
                  {getFormattedDisplayText(item, displayKey, extraDisplayKeys)}
                </Dropdown.Item>
              ))
            ) : (
              <Dropdown.Item disabled>{noResultsMessage}</Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <Form.Control type="hidden" value={value || ''} required={required} />
    </Form.Group>
  );
};

export default SearchableDropdown;
