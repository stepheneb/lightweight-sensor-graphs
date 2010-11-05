#!/usr/bin/env ruby

require 'yaml'

library_manifest_path = File.expand_path('../manifest-library', __FILE__)
jar_manifest_path = File.expand_path('../manifest-jar', __FILE__)

regex = ARGV[0]
if opts = ARGV[1]
  nosign = opts == '--nosign'
end

begin
  config = YAML.load_file(File.expand_path('../sign.yml',  __FILE__))
  public_dir = File.expand_path('../../public',  __FILE__)
  jars = Dir["#{public_dir}/**/*.jar"]
  jars = jars.grep(/#{regex}/) if regex
  puts "processing #{jars.length} jars ..."
  if nosign
    action_description = 'repacking'
  else
    action_description = 'signing and repacking'    
  end
  jars.each do |jar_path|
    path = File.dirname(jar_path)
    name = File.basename(jar_path)
    library = name[/-nar(__V.*?|)\.jar/]
    Dir.chdir(path) do
      puts "#{action_description}: #{path}/#{name}"
      `zip -d #{name} META-INF/\*` unless nosign
      if library
        `jar umf #{library_manifest_path} #{name}`
      else
        `jar umf #{jar_manifest_path} #{name}`
        `pack200 --repack #{name}`
      end
      # `jar -i #{name}`
      unless nosign
        `jarsigner -storepass #{config[:password]} #{name} #{config[:alias]}`
      end
      `pack200 #{name}.pack.gz #{name}` unless library
    end
  end
rescue Errno::ENOENT
  msg = <<-HEREDOC


*** missing bin/sign.yml

  cp bin/sign_sample.yml bin/sign.yml

  and edit appropriately ...
  
  HEREDOC
end
