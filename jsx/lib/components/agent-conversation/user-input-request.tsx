import React, { useState } from 'react';
import styled from 'styled-components';
import { Send, Calendar } from 'lucide-react';
import { UserInputRequest } from '../../hooks/use-agent-conversation';

const RequestContainer = styled.div`
  background: var(--color-primary-background);
  border: 1px solid var(--color-primary-border);
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  width: 100%;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const QuestionText = styled.h4`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '❓';
    font-size: 18px;
  }
`;

const ContextText = styled.p`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--color-secondary-text);
  line-height: 1.5;
`;

const InputForm = styled.form`
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-input-border, #e2e8f0);
  border-radius: 6px;
  font-size: var(--font-sm, 14px);
  background: var(--color-background, #ffffff);
  color: var(--color-foreground, #111827);
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: var(--color-primary, #6366f1);
  }
  
  &::placeholder {
    color: var(--color-muted-foreground, #9ca3af);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-input-border, #e2e8f0);
  border-radius: 6px;
  font-size: var(--font-sm, 14px);
  background: var(--color-background, #ffffff);
  color: var(--color-foreground, #111827);
  outline: none;
  transition: border-color 0.2s;
  cursor: pointer;
  
  &:focus {
    border-color: var(--color-primary, #6366f1);
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
  padding: 8px 0;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: var(--font-sm, 14px);
  color: var(--color-foreground, #111827);
`;

const RadioInput = styled.input`
  margin: 0;
  cursor: pointer;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: var(--font-sm, 14px);
  color: var(--color-foreground, #111827);
`;

const CheckboxInput = styled.input`
  margin: 0;
  cursor: pointer;
`;

const DateInput = styled.div`
  position: relative;
  
  input {
    width: 100%;
    padding: 8px 12px;
    padding-right: 36px;
    border: 1px solid var(--color-input-border, #e2e8f0);
    border-radius: 6px;
    font-size: var(--font-sm, 14px);
    background: var(--color-background, #ffffff);
    color: var(--color-foreground, #111827);
    outline: none;
    transition: border-color 0.2s;
    
    &:focus {
      border-color: var(--color-primary, #6366f1);
    }
  }
  
  svg {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-muted-foreground, #6b7280);
    pointer-events: none;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  transition: all 0.2s;
  
  &:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export interface UserInputRequestProps {
  request: UserInputRequest;
  onSubmit: (value: string) => void;
  theme?: any;
}

export function UserInputRequestComponent({ request, onSubmit }: UserInputRequestProps) {
  const [value, setValue] = useState<string>(request.default_value || '');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (request.input_type === 'multiselect') {
      onSubmit(selectedOptions.join(','));
    } else {
      onSubmit(value);
    }
  };

  const renderInput = () => {
    switch (request.input_type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={request.placeholder}
            autoFocus
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={request.placeholder}
            autoFocus
          />
        );

      case 'select':
        return (
          <Select value={value} onChange={(e) => setValue(e.target.value)} autoFocus>
            <option value="">Choose an option</option>
            {request.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <CheckboxGroup>
            {request.options?.map((option) => (
              <CheckboxLabel key={option}>
                <CheckboxInput
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOptions([...selectedOptions, option]);
                    } else {
                      setSelectedOptions(selectedOptions.filter((o) => o !== option));
                    }
                  }}
                />
                {option}
              </CheckboxLabel>
            ))}
          </CheckboxGroup>
        );

      case 'boolean':
        return (
          <RadioGroup>
            <RadioLabel>
              <RadioInput
                type="radio"
                name="boolean"
                value="true"
                checked={value === 'true'}
                onChange={(e) => setValue(e.target.value)}
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                name="boolean"
                value="false"
                checked={value === 'false'}
                onChange={(e) => setValue(e.target.value)}
              />
              No
            </RadioLabel>
          </RadioGroup>
        );

      case 'date':
        return (
          <DateInput>
            <input
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Calendar size={16} />
          </DateInput>
        );

      default:
        return null;
    }
  };

  return (
    <RequestContainer>
      <QuestionText>{request.question}</QuestionText>
      {request.context && <ContextText>{request.context}</ContextText>}
      
      <InputForm onSubmit={handleSubmit}>
        <InputWrapper>{renderInput()}</InputWrapper>
        <SubmitButton type="submit">
          <Send size={16} />
        </SubmitButton>
      </InputForm>
    </RequestContainer>
  );
}