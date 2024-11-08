// src/components/TimeInput/index.tsx
import React, { forwardRef } from "react";
import styled from "styled-components";

const TimeInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  appearance: none;
  background-color: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #0066cc;
  }
`;

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
  max?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  required = false,
  min = "00:00",
  max = "23:59",
}) => {
  const generateTimeOptions = () => {
    const options = [];
    for (let hours = 0; hours < 24; hours++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const time = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
        if (time >= min && time <= max) {
          options.push(time);
        }
      }
    }
    return options;
  };

  return (
    <TimeInputWrapper>
      <StyledSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Odaberi vrijeme</option>
        {generateTimeOptions().map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </StyledSelect>
    </TimeInputWrapper>
  );
};

export default TimeInput;
