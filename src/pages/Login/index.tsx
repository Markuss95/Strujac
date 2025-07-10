// src/pages/Login/index.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../contexts/AutContext";

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1rem;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 420px;
  width: 100%;
`;

const CardHeader = styled.div`
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  padding: 2rem 1.5rem;
  text-align: center;
`;

const CardTitle = styled.h2`
  color: white;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const CardBody = styled.form`
  padding: 2rem 2.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2c3e50;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: #f8f9fa;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    background: white;
  }

  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  padding: 0.75rem;
  background: #f8d7da;
  border-radius: 4px;
  text-align: center;
`;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <CardHeader>
          <CardTitle>Portal za rezervaciju vozila</CardTitle>
          <CardTitle>OSIJEK-KOTEKS</CardTitle>
        </CardHeader>
        <CardBody onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <FormGroup>
            <Label htmlFor="email">Email adresa</Label>
            <InputWrapper>
              <InputIcon>@</InputIcon>
              <Input
                id="email"
                type="email"
                placeholder="Unesite vašu email adresu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </InputWrapper>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="password">Lozinka</Label>
            <InputWrapper>
              <InputIcon>🔒</InputIcon>
              <Input
                id="password"
                type="password"
                placeholder="Unesite vašu lozinku"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </InputWrapper>
          </FormGroup>
          <Button type="submit" disabled={loading}>
            {loading ? "Prijavljujem se..." : "Prijavi se"}
          </Button>
        </CardBody>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
