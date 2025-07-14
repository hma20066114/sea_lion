import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest'; // Import vi from vitest
import App from './App';

// Mock the global fetch function to simulate API calls using Vitest's 'vi' object
global.fetch = vi.fn();

describe('Authentication Flow', () => {

    beforeEach(() => {
        fetch.mockClear();
        localStorage.clear();
    });

    test('renders login page by default', () => {
        render(<App />);
        // Check if the login form elements are present
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    test('switches to register page when "Register" button is clicked', () => {
        render(<App />);

        const registerButton = screen.getByRole('button', { name: /need an account\? register/i });
        fireEvent.click(registerButton);

        // Check if the registration form is now visible
        expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    test('successful login displays the dashboard', async () => {
        // Mock a successful login API response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access: 'fake_access_token',
                refresh: 'fake_refresh_token',
            }),
        });

        render(<App />);

        // Simulate user typing in the login form
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });

        // Simulate clicking the login button
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        // Wait for the dashboard to appear. This is an integration test.
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
        });

        // Check that the access token was stored
        expect(localStorage.getItem('access_token')).toBe('fake_access_token');
    });

    test('failed login shows an error message', async () => {
        // Mock a failed login API response
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: 'No active account found with the given credentials' }),
        });

        render(<App />);

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        // Wait for the error message to be displayed
        await waitFor(() => {
            expect(screen.getByText(/login failed/i)).toBeInTheDocument();
        });
    });
});

describe('Product Page Integration', () => {
    beforeEach(() => {
        fetch.mockClear();
        // Simulate being logged in
        localStorage.setItem('access_token', 'fake_access_token');
    });

    test('fetches and displays products on the product page', async () => {
        const mockProducts = [
            { id: 1, product_code: 'PROD-001', name: 'Laptop', price: '1200.00', stock: 10, image: null },
            { id: 2, product_code: 'PROD-002', name: 'Mouse', price: '25.00', stock: 50, image: null },
        ];

        // Mock the API call for fetching products
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockProducts,
        });

        render(<App />);

        // Navigate to the products page
        fireEvent.click(screen.getByRole('button', { name: /products/i }));

        // Wait for the products to be rendered in the table
        await waitFor(() => {
            expect(screen.getByText('PROD-001')).toBeInTheDocument();
            expect(screen.getByText('Mouse')).toBeInTheDocument();
        });
    });
});
