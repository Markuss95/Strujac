// src/components/Loading/index.tsx
import React from "react";
import styled from "styled-components";

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const LoadingText = styled.h2`
  color: #0066cc;
  font-size: 1.5rem;
`;

const Loading = () => {
  return (
    <LoadingContainer>
      <LoadingText>Učitavanje...</LoadingText>
    </LoadingContainer>
  );
};

export default Loading;
