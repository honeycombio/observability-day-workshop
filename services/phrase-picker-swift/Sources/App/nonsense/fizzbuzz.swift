

func fizzBuzz(i: Int) -> String {
    
    let isFizz = { (number: Int) -> Bool in
      number % 3 == 0
    }
    if (isFizz(i)) {
        return "Fizz"
    }
   return "\(i)"
}
