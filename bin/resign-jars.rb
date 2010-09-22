#!/usr/bin/env ruby

require 'yaml'

begin
  config = YAML.load_file(File.expand_path('../sign.yml',  __FILE__))
  Dir["../public/**/*.jar"].each do |jar_path|
    path = File.dirname(jar_path)
    name = File.basename(jar_path)
    Dir.chdir(path) do
      puts "re-signing and repacking: #{name}"
      `pack200 --repack #{name}`
      `jarsigner -storepass config[:password] #{name} config[:domain]`
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