#!/usr/bin/env ruby

public_dir = File.expand_path('../../public',  __FILE__)
jars = Dir["#{public_dir}/**/*.jar"]
puts "checking #{jars.length} jars ..."
jars.each do |jar_path|
  result = `jarsigner -verify -verbose -certs #{jar_path}`
  if result =~ /(no manifest|jar is unsigned)/
    puts "x  #{jar_path}"
  else
    puts "ok #{jar_path}"
  end
end
