/**
 * CountryCitySelector — Global Country → State → City selector
 * Uses the `country-state-city` npm package for worldwide location data.
 * Returns a formatted city string like "Lagos, Nigeria" or "London, England, United Kingdom".
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

interface CountryCitySelectorProps {
  value: string; // e.g. "Lagos, Nigeria"
  onChange: (cityString: string) => void;
  inputClassName?: string;
  labelClassName?: string;
}

const CountryCitySelector: React.FC<CountryCitySelectorProps> = ({
  value,
  onChange,
  inputClassName = '',
  labelClassName = '',
}) => {
  // Parse the initial value to pre-select country/state/city
  const [selectedCountryCode, setSelectedCountryCode] = useState('NG'); // Default Nigeria
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(() => Country.getAllCountries(), []);

  const states = useMemo(
    () => (selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []),
    [selectedCountryCode]
  );

  const cities = useMemo(() => {
    if (selectedCountryCode && selectedStateCode) {
      return City.getCitiesOfState(selectedCountryCode, selectedStateCode);
    }
    if (selectedCountryCode) {
      return City.getCitiesOfCountry(selectedCountryCode) || [];
    }
    return [];
  }, [selectedCountryCode, selectedStateCode]);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities.slice(0, 50); // show first 50 if no search
    const q = citySearch.toLowerCase();
    return cities.filter(c => c.name.toLowerCase().includes(q)).slice(0, 50);
  }, [cities, citySearch]);

  // Try to parse initial value on mount
  useEffect(() => {
    if (!value) return;
    // Try to match "City, State, Country" or "City, Country"
    const parts = value.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      const countryName = parts[parts.length - 1];
      const country = countries.find(
        c => c.name.toLowerCase() === countryName.toLowerCase()
      );
      if (country) {
        setSelectedCountryCode(country.isoCode);
        if (parts.length >= 3) {
          const stateName = parts[1];
          const statesOfCountry = State.getStatesOfCountry(country.isoCode);
          const state = statesOfCountry.find(
            s => s.name.toLowerCase() === stateName.toLowerCase()
          );
          if (state) {
            setSelectedStateCode(state.isoCode);
          }
        }
        setCitySearch(parts[0]);
      }
    }
  }, []); // only on mount

  const handleCountryChange = useCallback((code: string) => {
    setSelectedCountryCode(code);
    setSelectedStateCode('');
    setCitySearch('');
    onChange('');
  }, [onChange]);

  const handleStateChange = useCallback((code: string) => {
    setSelectedStateCode(code);
    setCitySearch('');
    onChange('');
  }, [onChange]);

  const selectCity = useCallback((city: ICity) => {
    const country = Country.getCountryByCode(city.countryCode);
    const state = State.getStateByCodeAndCountry(city.stateCode, city.countryCode);
    const parts = [city.name];
    if (state) parts.push(state.name);
    if (country) parts.push(country.name);
    const cityString = parts.join(', ');
    setCitySearch(city.name);
    setShowCityDropdown(false);
    onChange(cityString);
  }, [onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for city dropdown
  const handleCityKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showCityDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredCities.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectCity(filteredCities[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowCityDropdown(false);
    }
  }, [showCityDropdown, filteredCities, highlightedIndex, selectCity]);

  return (
    <div className="space-y-3">
      {/* Country Select */}
      <div>
        <label className={labelClassName}>Country *</label>
        <select
          value={selectedCountryCode}
          onChange={e => handleCountryChange(e.target.value)}
          className={`${inputClassName} bg-slate-800`}
        >
          <option value="" className="bg-slate-800">Select country</option>
          {countries.map(c => (
            <option key={c.isoCode} value={c.isoCode} className="bg-slate-800">
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* State Select (optional — only if states exist) */}
      {states.length > 0 && (
        <div>
          <label className={labelClassName}>State / Region</label>
          <select
            value={selectedStateCode}
            onChange={e => handleStateChange(e.target.value)}
            className={`${inputClassName} bg-slate-800`}
          >
            <option value="" className="bg-slate-800">All regions</option>
            {states.map(s => (
              <option key={s.isoCode} value={s.isoCode} className="bg-slate-800">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* City Search/Select */}
      <div className="relative" ref={dropdownRef}>
        <label className={labelClassName}>City *</label>
        <input
          ref={inputRef}
          type="text"
          value={citySearch}
          onChange={e => {
            setCitySearch(e.target.value);
            setShowCityDropdown(true);
            setHighlightedIndex(-1);
            // If user clears, clear value
            if (!e.target.value.trim()) onChange('');
          }}
          onFocus={() => setShowCityDropdown(true)}
          onKeyDown={handleCityKeyDown}
          placeholder={cities.length > 0 ? 'Search city...' : 'Type your city'}
          className={inputClassName}
          autoComplete="off"
        />

        {/* City dropdown */}
        {showCityDropdown && filteredCities.length > 0 && (
          <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-gray-900 shadow-xl">
            {filteredCities.map((c, i) => (
              <button
                key={`${c.name}-${c.stateCode}-${i}`}
                type="button"
                onClick={() => selectCity(c)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  i === highlightedIndex
                    ? 'bg-sky-500/20 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="font-medium">{c.name}</span>
                {c.stateCode && (
                  <span className="text-gray-500 ml-1">
                    {State.getStateByCodeAndCountry(c.stateCode, c.countryCode)?.name || c.stateCode}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showCityDropdown && citySearch.trim() && filteredCities.length === 0 && cities.length > 0 && (
          <div className="absolute z-50 w-full mt-1 rounded-lg border border-white/10 bg-gray-900 p-3">
            <p className="text-xs text-gray-400">No cities found. Try a different search.</p>
          </div>
        )}

        {/* When no cities in database, allow free-text */}
        {showCityDropdown && cities.length === 0 && citySearch.trim() && (
          <div className="absolute z-50 w-full mt-1 rounded-lg border border-white/10 bg-gray-900 shadow-xl">
            <button
              type="button"
              onClick={() => {
                const country = Country.getCountryByCode(selectedCountryCode);
                const cityString = country ? `${citySearch.trim()}, ${country.name}` : citySearch.trim();
                onChange(cityString);
                setShowCityDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Use "<span className="text-white font-medium">{citySearch.trim()}</span>"
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryCitySelector;
