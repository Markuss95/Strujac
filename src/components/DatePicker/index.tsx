// src/components/DatePicker/index.tsx
import React from "react";
import styled from "styled-components";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hr } from "date-fns/locale"; // Fixed import

// Register Croatian locale
registerLocale("hr", hr);

const DatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
      "Helvetica Neue", sans-serif;
  }

  .react-datepicker__input-container input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #0066cc;
    }
  }

  .react-datepicker__day--selected {
    background-color: #0066cc !important;
  }

  .react-datepicker__day--keyboard-selected {
    background-color: #0066cc !important;
  }

  .react-datepicker__header {
    background-color: #f0f0f0;
  }

  .react-datepicker__current-month {
    text-transform: capitalize;
  }

  .react-datepicker__day-name {
    text-transform: uppercase;
  }
`;

interface CustomDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onChange,
  placeholderText = "Odaberite datum",
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
      />
    </DatePickerWrapper>
  );
};

export default CustomDatePicker;
