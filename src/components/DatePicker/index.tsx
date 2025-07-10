// src/components/DatePicker/index.tsx
import React from "react";
import styled from "styled-components";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hr } from "date-fns/locale";

registerLocale("hr", hr);

const DatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
      "Helvetica Neue", sans-serif;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .react-datepicker__input-container input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    background-color: white;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    &::placeholder {
      color: #6c757d;
    }
  }

  .react-datepicker__header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #eee;
    padding: 12px 0;
  }

  .react-datepicker__current-month {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2c3e50;
    text-transform: capitalize;
  }

  .react-datepicker__day-name {
    color: #6c757d;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.85rem;
  }

  .react-datepicker__day {
    font-size: 0.95rem;
    color: #34495e;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #e9ecef;
      border-radius: 50%;
    }
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: #0066cc !important;
    color: white !important;
    border-radius: 50%;
  }

  .react-datepicker__day--today {
    font-weight: bold;
    color: #0066cc;
  }

  .react-datepicker__day--outside-month {
    color: #adb5bd;
  }

  .react-datepicker__day--disabled {
    color: #ccc !important;
    pointer-events: none;
  }

  .react-datepicker__navigation {
    top: 12px;
  }

  .react-datepicker__navigation-icon::before {
    border-color: #6c757d;
  }

  .react-datepicker__triangle {
    display: none; // Remove triangle for cleaner look
  }
`;

interface CustomDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  minDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onChange,
  placeholderText = "Odaberite datum",
  minDate,
}) => {
  return (
    <DatePickerWrapper>
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        locale="hr"
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholderText}
        isClearable
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        monthsShown={1}
        todayButton="Danas"
        clearButtonTitle="Očisti"
        previousMonthButtonLabel="Prethodni mjesec"
        nextMonthButtonLabel="Sljedeći mjesec"
        adjustDateOnChange
        minDate={minDate}
      />
    </DatePickerWrapper>
  );
};

export default CustomDatePicker;
