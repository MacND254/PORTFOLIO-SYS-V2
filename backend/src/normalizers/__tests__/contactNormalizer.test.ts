import { ContactNormalizer } from '../contactNormalizer';

describe('ContactNormalizer - Phone & PO Box Disambiguation', () => {
  describe('isPoBoxOrPostalCode', () => {
    it('should identify PO Box formats as PO boxes', () => {
      expect(ContactNormalizer.isPoBoxOrPostalCode('284-00900')).toBe(true);
      expect(ContactNormalizer.isPoBoxOrPostalCode('P.O. Box 284-00900')).toBe(true);
      expect(ContactNormalizer.isPoBoxOrPostalCode('P.O. BOX 284 - 00900 Kiambu')).toBe(true);
      expect(ContactNormalizer.isPoBoxOrPostalCode('Box 12345-00100')).toBe(true);
      expect(ContactNormalizer.isPoBoxOrPostalCode('Post Office Box 500')).toBe(true);
      expect(ContactNormalizer.isPoBoxOrPostalCode('P.O Box 99999')).toBe(true);
    });

    it('should NOT identify genuine phone numbers as PO boxes', () => {
      expect(ContactNormalizer.isPoBoxOrPostalCode('+254 712 345 678')).toBe(false);
      expect(ContactNormalizer.isPoBoxOrPostalCode('0712345678')).toBe(false);
      expect(ContactNormalizer.isPoBoxOrPostalCode('0112345678')).toBe(false);
      expect(ContactNormalizer.isPoBoxOrPostalCode('+1 (555) 234-5678')).toBe(false);
      expect(ContactNormalizer.isPoBoxOrPostalCode('020 1234567')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should reject PO box and postal code patterns as phone numbers', () => {
      expect(ContactNormalizer.isValidPhoneNumber('284-00900')).toBe(false);
      expect(ContactNormalizer.isValidPhoneNumber('P.O. Box 284-00900')).toBe(false);
      expect(ContactNormalizer.isValidPhoneNumber('Box 12345-00100')).toBe(false);
      expect(ContactNormalizer.isValidPhoneNumber('2018-2022')).toBe(false);
    });

    it('should validate standard 10+ digit local numbers and country-code international numbers', () => {
      expect(ContactNormalizer.isValidPhoneNumber('0712345678')).toBe(true);
      expect(ContactNormalizer.isValidPhoneNumber('0112345678')).toBe(true);
      expect(ContactNormalizer.isValidPhoneNumber('+254 712 345 678')).toBe(true);
      expect(ContactNormalizer.isValidPhoneNumber('+254712345678')).toBe(true);
      expect(ContactNormalizer.isValidPhoneNumber('00254712345678')).toBe(true);
      expect(ContactNormalizer.isValidPhoneNumber('+1 (555) 234-5678')).toBe(true);
      expect(ContactNormalizer.isValidPhoneNumber('0201234567')).toBe(true);
    });
  });

  describe('normalizePhones', () => {
    it('should filter out PO Box numbers and only retain valid phone numbers', () => {
      const candidates = [
        '284-00900',
        '+254 712 345 678',
        'P.O. Box 123',
        '0722123456',
      ];

      const result = ContactNormalizer.normalizePhones(candidates);

      expect(result).toHaveLength(2);
      expect(result[0].phone).toBe('+254712345678');
      expect(result[0].isPrimary).toBe(true);
      expect(result[1].phone).toBe('0722123456');
    });
  });

  describe('recoverPhonesFromText', () => {
    it('should extract genuine phone numbers from CV text containing both PO Box and Phone', () => {
      const cvText = `
        John Doe
        Software Engineer
        P.O. Box 284-00900 Kiambu, Kenya
        Email: john.doe@example.com
        Phone: +254 712 345 678 | Alt: 0722 000 111
      `;

      const phones = ContactNormalizer.recoverPhonesFromText(cvText);

      expect(phones.length).toBeGreaterThanOrEqual(1);
      expect(phones[0].phone).toBe('+254712345678');
      expect(phones.some((p) => p.phone.includes('28400900'))).toBe(false);
    });

    it('should extract local 10-digit phone numbers starting with 0', () => {
      const cvText = `
        Jane Smith
        Address: Box 500-00100 Nairobi
        Tel: 0712345678
      `;

      const phones = ContactNormalizer.recoverPhonesFromText(cvText);

      expect(phones).toHaveLength(1);
      expect(phones[0].phone).toBe('0712345678');
    });
  });

  describe('normalizeLocation', () => {
    it('should extract postalCode and retain raw PO Box address', () => {
      const location = ContactNormalizer.normalizeLocation('P.O. Box 284-00900 Kiambu, Kenya');

      expect(location.raw).toBe('P.O. Box 284-00900 Kiambu, Kenya');
      expect(location.postalCode).toBe('00900');
      expect(location.city).toBe('P.O. Box 284-00900 Kiambu');
      expect(location.country).toBe('Kenya');
    });

    it('should parse Box-Postal pair string', () => {
      const location = ContactNormalizer.normalizeLocation('284-00900');

      expect(location.postalCode).toBe('00900');
    });
  });
});
