source "http://rubygems.org"

group :development do
  gem "net-ssh"
end

platforms :jruby do
  group :development do
    gem "warbler"
  end
end

platforms :ruby do
  group :development do
    gem "net-ssh"
    gem 'thin', '>= 1.2.7'
  end
end

gem 'rack', '>= 1.1.0'
