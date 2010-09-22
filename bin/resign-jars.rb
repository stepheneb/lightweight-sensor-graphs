#!/usr/bin/env ruby

require 'yaml'

begin
  config = YAML.load_file(File.expand_path('../sign.yml',  __FILE__))
  public_dir = File.expand_path('../../public',  __FILE__)
  jars = Dir["#{public_dir}/**/*.jar"]
  puts "processing #{jars.length} jars ..."
  jars.each do |jar_path|
    path = File.dirname(jar_path)
    name = File.basename(jar_path)
    Dir.chdir(path) do
      puts "signing and repacking: #{name}"
      `zip -d #{name} META-INF/\*`
      `pack200 --repack #{name}`
      `jar -i #{name}`
      `jarsigner -storepass config[:password] #{name} config[:alias]`
      `pack200 #{name}.pack.gz #{name}`
    end
  end
rescue Errno::ENOENT
  msg = <<-HEREDOC


*** missing bin/sign.yml

  cp bin/sign_sample.yml bin/sign.yml

  and edit ...
  
  HEREDOC
end