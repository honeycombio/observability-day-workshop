@testable import App
import XCTest

final class FizzBuzzTests: XCTestCase {
    func testFizzBuzz() {
        XCTAssertEqual(fizzBuzz(i: 1), "1")
        XCTAssertEqual(fizzBuzz(i: 2), "2")
        XCTAssertEqual(fizzBuzz(i: 3), "Fizz")
    }
}
