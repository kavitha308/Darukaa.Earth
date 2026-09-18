import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Darukaa.Earth Smoke Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderApp = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

  it('renders branding title and navigation controls', () => {
    renderApp();
    expect(screen.getByText(/Darukaa/i)).toBeInTheDocument();
    expect(screen.getByText(/New Project/i)).toBeInTheDocument();
  });

  it('renders project portfolio and sites in sidebar', () => {
    renderApp();
    expect(screen.getByText(/Project Portfolio/i)).toBeInTheDocument();
  });

  it('renders polygon drawing button on the map', () => {
    renderApp();
    const drawBtn = screen.getByText(/Draw New Site Polygon/i);
    expect(drawBtn).toBeInTheDocument();

    fireEvent.click(drawBtn);
    expect(screen.getByText(/Click on the map to add boundary points/i)).toBeInTheDocument();
  });
});
