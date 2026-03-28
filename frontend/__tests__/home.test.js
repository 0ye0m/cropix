import { render, screen } from "@testing-library/react";

// ✅ Mock next/link
jest.mock("next/link", () => {
  return ({ children }) => children;
});

// ✅ Mock framer-motion (important)
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
    h1: ({ children }) => <h1>{children}</h1>,
    span: ({ children }) => <span>{children}</span>,
    p: ({ children }) => <p>{children}</p>,
    footer: ({ children }) => <footer>{children}</footer>,
  },
}));

// ✅ Import your page
import HomePage from "../app/page";

describe("Home Page", () => {
  test("renders main heading", () => {
    render(<HomePage />);

    const heading = screen.getByText(/smarter farming/i);
    expect(heading).toBeInTheDocument();
  });

  test("renders get started button", () => {
    render(<HomePage />);

    const button = screen.getByText(/get started/i);
    expect(button).toBeInTheDocument();
  });

  test("renders feature cards", () => {
    render(<HomePage />);

    const feature = screen.getByText(/crop yield prediction/i);
    expect(feature).toBeInTheDocument();
  });
});
