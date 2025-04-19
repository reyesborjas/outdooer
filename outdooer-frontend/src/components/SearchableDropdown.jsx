// src/components/SearchableDropdown.jsx
import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Dropdown, Button, Spinner } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchableDropdown = ({
  items,
  onSelect,
  value,
  valueKey,
  displayKey,
  extraDisplayKeys = [],
  placeholder = "Search...",
  label,
  isLoading = false,
  required = false,
  searchKeys = [],
  noResultsMessage = "No results found"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  
  // Get the display value for the selected item
  const getDisplayValue = () => {
    if (!value) return '';
    
    const selectedItem = items.find(item => item[valueKey] === Number(value) || item[valueKey] === value);
    if (!selectedItem) return '';
    
    return selectedItem[displayKey];
  };
  
  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }
    
    const search = searchTerm.toLowerCase().trim();
    
    const filtered = items.filter(item => {
      // Search in all specified keys
      return searchKeys.some(key => {
        if (!item[key]) return false;
        return item[key].toString().toLowerCase().includes(search);
      });
    });
    
    setFilteredItems(filtered);
  }, [searchTerm, items, searchKeys]);
  
  // Format the item display
  const formatItemDisplay = (item) => {
    if (extraDisplayKeys.length === 0) {
      return item[displayKey];
    }
    
    // Format with extra information, e.g., "Country, Region - Location Name"
    const extraInfo = extraDisplayKeys
      .map(key => item[key])
      .filter(value => value)
      .join(', ');
      
    return extraInfo ? `${extraInfo} - ${item[displayKey]}` : item[displayKey];
  };
  
  const handleSelect = (selectedItem) => {
    onSelect(selectedItem[valueKey]);
    setShowDropdown(false);
    setSearchTerm('');
  };
  
  const handleClear = () => {
    onSelect('');
    setSearchTerm('');
  };
  
  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label}{required && <span className="text-danger">*</span>}</Form.Label>}
      
      <InputGroup>
        <Form.Control
          type="text"
          placeholder={placeholder}
          onClick={() => setShowDropdown(true)}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          value={searchTerm || getDisplayValue()}
          required={required}
        />
        
        {value && (
          <Button 
            variant="outline-secondary" 
            onClick={handleClear}
            title="Clear selection"
          >
            <FaTimes />
          </Button>
        )}
        
        <InputGroup.Text>
          {isLoading ? <Spinner animation="border" size="sm" /> : <FaSearch />}
        </InputGroup.Text>
      </InputGroup>
      
      <Dropdown show={showDropdown} onToggle={setShowDropdown} className="mt-1">
        <Dropdown.Menu 
          style={{ width: '100%', maxHeight: '300px', overflowY: 'auto' }}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <Dropdown.Item 
                key={item[valueKey]} 
                onClick={() => handleSelect(item)}
                active={value === item[valueKey]}
              >
                {formatItemDisplay(item)}
              </Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item disabled>{noResultsMessage}</Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </Form.Group>
  );
};

export default SearchableDropdown;