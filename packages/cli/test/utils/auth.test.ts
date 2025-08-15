import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { saveToken, loadToken, clearToken } from "../../src/utils/auth";

describe("Auth Utils", () => {
  const testToken = "cli_test123456789";
  const testTokenPath = join(process.cwd(), "better-env.json");

  beforeEach(() => {
    // Clean up any existing test file
    if (existsSync(testTokenPath)) {
      unlinkSync(testTokenPath);
    }
  });

  afterEach(() => {
    // Clean up test file
    if (existsSync(testTokenPath)) {
      unlinkSync(testTokenPath);
    }
  });

  describe("saveToken", () => {
    test("should save token to JSON file", () => {
      saveToken(testToken);

      expect(existsSync(testTokenPath)).toBe(true);
      
      const config = JSON.parse(readFileSync(testTokenPath, "utf8"));
      expect(config.cliToken).toBe(testToken);
    });

    test("should set secure file permissions (600)", () => {
      saveToken(testToken);

      // Check file permissions (600 = owner read/write only)
      const stats = require("fs").statSync(testTokenPath);
      const permissions = (stats.mode & parseInt("777", 8)).toString(8);
      expect(permissions).toBe("600");
    });

    test("should merge with existing config", () => {
      // Create existing config
      writeFileSync(testTokenPath, JSON.stringify({ 
        existingKey: "value" 
      }));

      saveToken(testToken);

      const config = JSON.parse(readFileSync(testTokenPath, "utf8"));
      expect(config.cliToken).toBe(testToken);
      expect(config.existingKey).toBe("value");
    });
  });

  describe("loadToken", () => {
    test("should load token from JSON file", () => {
      // Create test file
      writeFileSync(testTokenPath, JSON.stringify({ 
        cliToken: testToken 
      }));

      const loadedToken = loadToken();
      expect(loadedToken).toBe(testToken);
    });

    test("should return null if file doesn't exist", () => {
      const loadedToken = loadToken();
      expect(loadedToken).toBe(null);
    });

    test("should return null if cliToken key doesn't exist", () => {
      // Create test file without cliToken
      writeFileSync(testTokenPath, JSON.stringify({ 
        otherKey: "value" 
      }));

      const loadedToken = loadToken();
      expect(loadedToken).toBe(null);
    });
  });

  describe("clearToken", () => {
    test("should remove cliToken from config", () => {
      // Create test file with token and other data
      writeFileSync(testTokenPath, JSON.stringify({ 
        cliToken: testToken,
        otherKey: "value"
      }));

      clearToken();

      expect(existsSync(testTokenPath)).toBe(true);
      const config = JSON.parse(readFileSync(testTokenPath, "utf8"));
      expect(config.cliToken).toBeUndefined();
      expect(config.otherKey).toBe("value");
    });

    test("should delete file if no other keys remain", () => {
      // Create test file with only token
      writeFileSync(testTokenPath, JSON.stringify({ 
        cliToken: testToken
      }));

      clearToken();

      expect(existsSync(testTokenPath)).toBe(false);
    });

    test("should handle non-existent file gracefully", () => {
      // Should not throw
      expect(() => clearToken()).not.toThrow();
    });
  });

  describe("security features", () => {
    test("token file should have restricted permissions", () => {
      saveToken(testToken);

      const stats = require("fs").statSync(testTokenPath);
      const permissions = (stats.mode & parseInt("777", 8)).toString(8);
      
      // Should be 600 (owner read/write only)
      expect(permissions).toBe("600");
    });
  });
});
