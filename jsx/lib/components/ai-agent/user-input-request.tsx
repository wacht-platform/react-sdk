import React, { useState } from "react";
import styled from "styled-components";
import { Send, HelpCircle } from "lucide-react";

const RequestContainer = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #7dd3fc;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  background: #0ea5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const QuestionContent = styled.div`
  flex: 1;
`;

const Question = styled.h4`
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #0c4a6e;
  line-height: 1.4;
`;

const Context = styled.p`
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
`;

const SuggestionsContainer = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SuggestionChip = styled.button`
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 20px;
  font-size: 12px;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ValidationHint = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InputForm = styled.form`
  margin-top: 12px;
  display: flex;
  gap: 8px;
`;

const InputField = styled.input`
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 16px;
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: #0284c7;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
  }
`;

export interface UserInputRequestData {
  question: string;
  context?: string;
  suggestions?: string[];
  validation_hints?: string;
}

export interface UserInputRequestProps {
  data: UserInputRequestData;
  onSubmit: (value: string) => void;
  theme?: any;
}

export function AIAgentUserInputRequest({ data, onSubmit }: UserInputRequestProps) {
  const [inputValue, setInputValue] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !hasSubmitted) {
      setHasSubmitted(true);
      onSubmit(trimmedValue);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!hasSubmitted) {
      setInputValue(suggestion);
    }
  };

  if (hasSubmitted) {
    return (
      <RequestContainer style={{ opacity: 0.7 }}>
        <QuestionHeader>
          <IconWrapper>
            <HelpCircle size={18} />
          </IconWrapper>
          <QuestionContent>
            <Question>{data.question}</Question>
            <Context style={{ fontStyle: 'italic' }}>✓ You answered: "{inputValue}"</Context>
          </QuestionContent>
        </QuestionHeader>
      </RequestContainer>
    );
  }

  return (
    <RequestContainer>
      <QuestionHeader>
        <IconWrapper>
          <HelpCircle size={18} />
        </IconWrapper>
        <QuestionContent>
          <Question>{data.question}</Question>
          {data.context && <Context>{data.context}</Context>}
        </QuestionContent>
      </QuestionHeader>

      {data.suggestions && data.suggestions.length > 0 && (
        <SuggestionsContainer>
          {data.suggestions.map((suggestion, index) => (
            <SuggestionChip
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </SuggestionChip>
          ))}
        </SuggestionsContainer>
      )}

      {data.validation_hints && (
        <ValidationHint>
          <span>ℹ️</span>
          <span>{data.validation_hints}</span>
        </ValidationHint>
      )}

      <InputForm onSubmit={handleSubmit}>
        <InputField
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your answer..."
          autoFocus
        />
        <SubmitButton type="submit" disabled={!inputValue.trim()}>
          <Send size={14} />
          Send
        </SubmitButton>
      </InputForm>
    </RequestContainer>
  );
}