import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { ReactNode } from 'react';
import { lightTheme } from '@infra/styles/themes/light.theme';
import { FormField } from './FormField';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <StyledThemeProvider theme={lightTheme}>{children}</StyledThemeProvider>
);

const inputChild = (_id: string) => (controlProps: { id: string }) => (
  <input data-testid="control" {...controlProps} />
);

describe('FormField — label rendering', () => {
  it('renders a string label', () => {
    render(
      <FormField id="name" label="Full name">
        {inputChild('name')}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Full name')).toBeInTheDocument();
  });

  it('renders a ReactNode label — both text and child element are present', () => {
    const label = (
      <>
        <span>Email</span>
        <span data-testid="optional-hint">(optional)</span>
      </>
    );

    render(
      <FormField id="email" label={label}>
        {inputChild('email')}
      </FormField>,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByTestId('optional-hint')).toBeInTheDocument();
    expect(screen.getByTestId('optional-hint')).toHaveTextContent('(optional)');
  });

  it('label is associated with the control via htmlFor', () => {
    render(
      <FormField id="phone" label="Phone">
        {inputChild('phone')}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
  });
});

describe('FormField — required mark', () => {
  it('shows the required asterisk when required={true}', () => {
    render(
      <FormField id="req" label="Field" required>
        {inputChild('req')}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render an asterisk when required is omitted', () => {
    render(
      <FormField id="opt" label="Field">
        {inputChild('opt')}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('visually hidden suffix uses requiredAriaSuffix prop', () => {
    render(
      <FormField id="req2" label="Field" required requiredAriaSuffix="required">
        {inputChild('req2')}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});

describe('FormField — helper and error messages', () => {
  it('renders helper text', () => {
    render(
      <FormField id="h" label="Label" helperText="Enter your full name">
        {inputChild('h')}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('renders error text with role="alert"', () => {
    render(
      <FormField id="e" label="Label" errorText="This field is required">
        {inputChild('e')}
      </FormField>,
      { wrapper: Wrapper },
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('This field is required');
  });

  it('does not render helper text when errorText is provided', () => {
    render(
      <FormField id="both" label="Label" helperText="Hint" errorText="Bad value">
        {inputChild('both')}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('FormField — aria wiring', () => {
  it('sets aria-invalid on control when errorText is present', () => {
    render(
      <FormField id="inv" label="Label" errorText="Oops">
        {(props) => <input data-testid="ctrl" {...props} />}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('ctrl')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when there is no error', () => {
    render(
      <FormField id="valid" label="Label">
        {(props) => <input data-testid="ctrl" {...props} />}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('ctrl')).not.toHaveAttribute('aria-invalid');
  });

  it('sets aria-required on control when required={true}', () => {
    render(
      <FormField id="arq" label="Label" required>
        {(props) => <input data-testid="ctrl" {...props} />}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('ctrl')).toHaveAttribute('aria-required', 'true');
  });

  it('sets aria-describedby pointing to helper text id', () => {
    render(
      <FormField id="desc" label="Label" helperText="Hint">
        {(props) => <input data-testid="ctrl" {...props} />}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('ctrl')).toHaveAttribute('aria-describedby', 'desc-helper');
  });

  it('sets aria-describedby pointing to error text id', () => {
    render(
      <FormField id="errdesc" label="Label" errorText="Bad">
        {(props) => <input data-testid="ctrl" {...props} />}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('ctrl')).toHaveAttribute('aria-describedby', 'errdesc-error');
  });

  it('does not set aria-describedby when neither helper nor error is present', () => {
    render(
      <FormField id="nodesc" label="Label">
        {(props) => <input data-testid="ctrl" {...props} />}
      </FormField>,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('ctrl')).not.toHaveAttribute('aria-describedby');
  });
});
