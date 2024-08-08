import { MaskOptions, StringMask } from "../src/index";

type TestCfg = {
  text: string;
  pattern: string;
  expected?: string;
  valid?: boolean;
  options?: MaskOptions;
};

describe("mask-formatter", function () {
  function testFn(p: TestCfg) {
    const processed = new StringMask(p.pattern, p.options).process(p.text);

    expect(processed.result).toBe(p.expected);
    expect(processed.valid).toBe(p.valid);
  }

  describe("number:", function () {
    let p: TestCfg = {
      text: "7612345678980",
      pattern: "#.##0,00",
      expected: "76.123.456.789,80",
      valid: true,
      options: { reverse: true },
    };

    test("reverse '#.##0,00' should format '7612345678980' to '76.123.456.789,80'", function (done) {
      testFn(p);
      done();
    });

    test("reverse '#.##0,00' should format '112' to '1,12'", function (done) {
      p.text = "112";
      p.expected = "1,12";
      testFn(p);
      done();
    });

    test("reverse '#.##0,00' should format '12345678a80' to ',80' and be invalid", function (done) {
      p.text = "12345678a80";
      p.expected = ",80";
      p.valid = false;
      testFn(p);
      done();
    });

    test("reverse '#.##0' should format '123456789' to '123.456.789'", function (done) {
      p.pattern = "#.##0";
      p.text = "123456789";
      p.expected = "123.456.789";
      p.valid = true;
      testFn(p);
      done();
    });

    test("reverse '#0' should format '123456788' to '123456788'", function (done) {
      p.pattern = "#0";
      p.text = "123456788";
      p.expected = "123456788";
      p.valid = true;
      testFn(p);
      done();
    });

    test("reverse '#,0' should format '123456788' to '12345678,8'", function (done) {
      p.pattern = "#,0";
      p.text = "123456788";
      p.expected = "12345678,8";
      p.valid = true;
      testFn(p);
      done();
    });

    test("reverse '#.##0,00' should format '1' to '0,01'", function (done) {
      testFn({
        text: "1",
        pattern: "#.##0,00",
        expected: "0,01",
        valid: true,
        options: { reverse: true },
      });
      done();
    });
  });

  describe("percentage:", function () {
    let p: TestCfg = {
      text: "7612345678980",
      pattern: "#.##0,00 %",
      expected: "76.123.456.789,80 %",
      valid: true,
      options: { reverse: true },
    };

    test("reverse '#.##0,00 %' should format '7612345678980' to '76.123.456.789,80 %'", function (done) {
      testFn(p);
      done();
    });

    test("reverse '#.##0,00 %' should format '123a4567810' to '45.678,10 %' and be invalid", function (done) {
      p.text = "123a4567810";
      p.expected = "45.678,10 %";
      p.valid = false;
      testFn(p);
      done();
    });

    test("reverse '#0,00%' should format '1234567810' to '12345678,10%' and be invalid", function (done) {
      p.pattern = "#0,00%";
      p.text = "1234567810";
      p.expected = "12345678,10%";
      p.valid = true;
      testFn(p);
      done();
    });

    test("'0,#' should format '1234567' to '1,234567'", function (done) {
      p.pattern = "0,#";
      p.text = "1234567";
      p.expected = "1,234567";
      p.valid = true;
      p.options = { reverse: false };
      testFn(p);
      done();
    });
  });

  describe("money:", function () {
    let p: TestCfg = {
      text: "7612345678980",
      pattern: "R$ #.##0,00",
      expected: "R$ 76.123.456.789,80",
      valid: true,
      options: { reverse: true },
    };

    test("reverse 'R$ #.##0,00' should format '7612345678980' to 'R$ 76.123.456.789,80'", function (done) {
      testFn(p);
      done();
    });

    test("reverse 'R$ #.##0,00' should format '100' to 'R$ 1,00'", function (done) {
      p.text = "100";
      p.expected = "R$ 1,00";
      testFn(p);
      done();
    });

    test("reverse 'R$ #.##0,00' should format '1' to 'R$ 0,01'", function (done) {
      p.text = "1";
      p.expected = "R$ 0,01";
      testFn(p);
      done();
    });

    test("reverse 'R$ #.##0,00' should format '123a4567810' to '45.678,10' and be invalid", function (done) {
      p.text = "123a4567810";
      p.expected = "45.678,10";
      p.valid = false;
      testFn(p);
      done();
    });

    test("reverse '$ #,##0.000' should format '7612345678980' to '$ 7,612,345,678.980'", function (done) {
      p.pattern = "$ #,##0.000";
      p.text = "7612345678980";
      p.expected = "$ 7,612,345,678.980";
      p.valid = true;
      testFn(p);
      done();
    });
  });

  describe("CPF:", function () {
    let p: TestCfg = {
      text: "12345678980",
      pattern: "000.000.000-00",
      expected: "123.456.789-80",
      valid: true,
    };

    test("'000.000.000-00' should format '12345678980' to '123.456.789-80'", function (done) {
      testFn(p);
      done();
    });

    test("reverse '000.000.000-00' should format '12345678980' to '123.456.789-80'", function (done) {
      p.options = { reverse: true };
      testFn(p);
      done();
    });

    test("'000.000.000-00' should format '12345678a80' to '123.456.78'", function (done) {
      p.options = { reverse: false };
      p.text = "12345678a80";
      p.expected = "123.456.78";
      p.valid = false;
      testFn(p);
      done();
    });
  });

  describe("Date:", function () {
    let p: TestCfg = {
      text: "23111987",
      pattern: "90/90/9900",
      expected: "23/11/1987",
      valid: true,
    };

    test("'90/90/9900' should format '23111987' to '23/11/1987'", function (done) {
      testFn(p);
      done();
    });

    test("'90/90/9900' should format '1187' to '1/1/87'", function (done) {
      p.text = "1187";
      p.expected = "1/1/87";
      testFn(p);
      done();
    });
  });

  describe("phone:", function () {
    test("'+00 (00) 0000-0000' should format '553122222222' to '+55 (31) 2222-2222'", function (done) {
      let formatter = new StringMask("+00 (00) 0000-0000");
      let processed = formatter.process("553122222222");
      expect(processed.result).toBe("+55 (31) 2222-2222");
      expect(processed.valid).toBe(true);
      done();
    });

    let p: TestCfg = {
      text: "553122222222",
      pattern: "+00 (00) 90000-0000",
      expected: "+55 (31) 2222-2222",
      valid: true,
    };

    test("'+00 (00) 90000-0000' should format '553122222222' to '+55 (31) 2222-2222'", function (done) {
      testFn(p);
      done();
    });

    test("reverse '+00 (00) 90000-0000' should format '553122222222' to '+55 (31) 2222-2222'", function (done) {
      p.options = { reverse: true };
      testFn(p);
      done();
    });

    test("'+00 (00) 90000-0000' should format '5531622222222' to '+55 (31) 62222-2222'", function (done) {
      p.options = { reverse: false };
      p.text = "5531622222222";
      p.expected = "+55 (31) 62222-2222";
      testFn(p);
      done();
    });

    test("'+00 (00) 90000-0000' should format '5531622222222' to '+55 (31) 62222-2222'", function (done) {
      p.options = { reverse: true };
      testFn(p);
      done();
    });
  });

  describe("RG:", function () {
    let p: TestCfg = {
      text: "mg11862459",
      pattern: "SS 00.000.000",
      expected: "mg 11.862.459",
      valid: true,
    };

    test("'SS 00.000.000' should format 'mg11862459' to 'mg 11.862.459'", function (done) {
      testFn(p);
      done();
    });

    test("reverse 'SS 00.000.000' should format 'mg11862459' to 'mg 11.862.459'", function (done) {
      p.options = { reverse: true };
      testFn(p);
      done();
    });
  });

  describe("Case:", function () {
    test("'UUUUUUU' should format 'Testing' to 'TESTING'", function (done) {
      testFn({
        text: "Testing",
        pattern: "UUUUUUU",
        expected: "TESTING",
        valid: true,
      });
      done();
    });

    test("'LLLLLLL' should format 'Testing' to 'testing'", function (done) {
      testFn({
        text: "Testing",
        pattern: "LLLLLLL",
        expected: "testing",
        valid: true,
      });
      done();
    });
  });

  describe("Scientific notations:", function () {
    test("'0.00E#' should format '12310' to '1.23E10'", function (done) {
      testFn({
        text: "12310",
        pattern: "0.00E#",
        expected: "1.23E10",
        valid: true,
      });
      done();
    });

    test("'0.0E#' should format '12310' to '1.2E310'", function (done) {
      testFn({
        text: "12310",
        pattern: "0.0E#",
        expected: "1.2E310",
        valid: true,
      });
      done();
    });

    test("'0.000E#' should format '123' to '1.23'", function (done) {
      testFn({
        text: "123",
        pattern: "0.000E#",
        expected: "1.23",
        valid: false,
      });
      done();
    });
  });

  describe("Iban:", function () {
    test(
      "'UUAA AAAA AAAA AAAA AAAA AAAA AAA' should format 'FR761111900069410000AA33222' " +
        "to 'FR76 1111 BBBB 6941 0000 AA33 222'",
      function (done) {
        testFn({
          text: "FR761111BBBB69410000AA33222",
          pattern: "UUAA AAAA AAAA AAAA AAAA AAAA AAA",
          expected: "FR76 1111 BBBB 6941 0000 AA33 222",
          valid: true,
        });
        done();
      },
    );

    test(
      "'UUAA AAAA AAAA AAAA AAAA AAAA AAA' should format 'FR761111900069410000AA33222' to " +
        "'FR76 1111 BBBB 6941 0000 AA33'",
      function (done) {
        testFn({
          text: "FR761111BBBB69410000AA-3222",
          pattern: "UUAA AAAA AAAA AAAA AAAA AAAA AAA",
          expected: "FR76 1111 BBBB 6941 0000 AA",
          valid: false,
        });
        done();
      },
    );
  });

  describe("Other usages:", function () {
    test("Should run validate", function (done) {
      expect(StringMask.validate("mg11862459", "SS 00.000.000")).toBeTruthy();
      expect(StringMask.validate("1011862459", "SS 00.000.000")).toBeFalsy();
      done();
    });

    test("Should apply mask", function (done) {
      expect(StringMask.apply("mg11862459", "SS 00.000.000")).toBe(
        "mg 11.862.459",
      );
      done();
    });

    test("Should not apply mask on empty values", function (done) {
      expect(StringMask.apply("", "SS 00.000.000")).toBe("");
      expect(StringMask.apply(null, "SS 00.000.000")).toBe("");
      expect(StringMask.apply(undefined, "SS 00.000.000")).toBe("");
      done();
    });

    test("should not escape in the recursive portion of pattern", function (done) {
      expect(StringMask.apply("123", "YZ #.##0,00", { reverse: true })).toBe(
        "YZ 1,23",
      );
      expect(StringMask.apply("123", "YZ#.##0,00", { reverse: true })).toBe(
        "YZ1,23",
      );
      expect(StringMask.apply("123", "US #.##0,00", { reverse: true })).toBe(
        "US 1,23",
      );
      expect(StringMask.apply("123", "US.#.##0,00", { reverse: true })).toBe(
        "US.1,23",
      );
      expect(
        StringMask.apply("123456789", "US #,##0.00", { reverse: true }),
      ).toBe("US 1,234,567.89");
      expect(
        StringMask.apply("123456789", "$U$S #,##0.00", { reverse: true }),
      ).toBe("$U$S 1,234,567.89");

      expect(StringMask.apply("123", "00,# YZ")).toBe("12,3 YZ");
      expect(StringMask.apply("123", "00,0##.# US")).toBe("12,3 US");
      expect(StringMask.apply("123456789", "00,0##.# US")).toBe(
        "12,345.678.9 US",
      );
      expect(StringMask.apply("123456789", "00,0##.# $U$S")).toBe(
        "12,345.678.9 $U$S",
      );

      expect(StringMask.apply("123456789", "#L##0,00", { reverse: true })).toBe(
        "1L234L567,89",
      );
      done();
    });

    test("should work with escaped tokens", function (done) {
      expect(StringMask.apply("125", "$##")).toBe("#125");
      expect(StringMask.apply("125", "#$#", { reverse: true })).toBe("125#");
      expect(StringMask.apply("JUSTTEST", "AAAA $A AAAA")).toBe("JUST A TEST");

      const res = StringMask.process("125a123", "$##");
      expect(res.result).toBe("#125");
      expect(res.valid).toBe(false);

      done();
    });
  });
});
