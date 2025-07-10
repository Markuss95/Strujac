// Updated src/components/TimeInput/index.tsx
import React from "react";
import styled from "styled-components";

const TimeInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  appearance: none;
  background-color: white;
  color: #34495e;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  option {
    color: #34495e;
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
