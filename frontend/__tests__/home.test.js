import { render, screen } from "@testing-library/react";
import HomePage from "../app/page"; // adjust if needed

describe("Home Page", () => {
  test("renders heading", () => {
    render(<HomePage />);
    
    const heading = screen.getByText(/cropix/i);
    expect(heading).toBeInTheDocument();
  });
});
