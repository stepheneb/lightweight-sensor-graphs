Vernier GoIO Lightweight Grapher
============================================

Prerequisites
------------

* git
* ruby 1.8.7 or 1.9.2 or JRuby 1.5.3+

If you are using Mac OS X or Linux I recommend using rvm to install ruby 1.9.2: http://rvm.beginrescueend.com/.

I've also tested this code under JRuby 1.5.2 and Ruby 1.8.7.

Install
------------

    gem install rack thin
    git clone git://github.com/stepheneb/lightweight-sensor-graphs.git
    cd lightweight-sensor-graphs
    cp config.sample.yml config.yml

If you are running this in JRuby the RubyGem *thin* is not needed (and doesn't work with JRuby).

Demo
------------

1. Plugin a Vernier GoLink with an attached temperature or light probe.
2. Start local server.
    ruby start_local_server.rb
3. Open: http://localhost:4321/
4. Select either: goio-temperature-graph.html or goio-light-graph.html 
4. Click the *start* button.

Deploying to a remote server
------------
If have a remote server with Apache, install the Ruby gem passenger, and setup an environment for hosting a rack application you can use the script:

    bin/update_server.rb

to push the master branch of http://github.com/stepheneb/lightweight-sensor-graphs to the server.

First copy the file bin/deploy_sample.yml to bin/deploy.yml and enter the host name and path on the remote server as well as the ssh username for the user under which the deploy will be executed.

File: bin/deploy_sample.yml

    --- 
    :username: username
    :dir: /path/on/server
    :host: server.com

Apache and Passenger configuration for remote server
------------
See the install and serving rack application sections in the [Phusion Passenger users guide](http://www.modrails.com/documentation/Users%20guide%20Apache.html).

Apache http.conf Passenger configuration example:

    LoadModule passenger_module /usr/local/lib/ruby/gems/1.8/gems/passenger-2.2.15/ext/apache2/mod_passenger.so
    PassengerRoot /usr/local/lib/ruby/gems/1.8/gems/passenger-2.2.15
    PassengerRuby /usr/local/bin/ruby
    
Apache vhost example:

    <VirtualHost *:80>
        ServerName jnlp.dev.concord.org
        DocumentRoot /web/jnlp.dev.concord.org/public
        <Directory /web/jnlp.dev.concord.org/public>
            Allow from all
            Options -MultiViews
        </Directory>
    </VirtualHost>

Example of file system permissions on remote server:

    [jnlp.dev.concord.org (master)]$ ls -l
    total 44
    drwxrwsr-x 2 apache    users 4096 Oct 14 00:45 bin
    -rw-r--r-- 1 sbannasch users  273 Sep 22 14:10 config.ru
    -rw-r--r-- 1 sbannasch users   35 Sep 10 01:31 config.sample.yml
    -rw-rw-r-- 1 apache    users   35 Sep 10 01:14 config.yml
    -rw-rw-r-- 1 apache    users   39 Sep 10 00:53 config.yml~
    drwxrwsr-x 7 apache    users 4096 Oct 28 12:20 public
    drwxrwsr-x 2 apache    users 4096 Sep 24 11:05 rack
    -rw-r--r-- 1 sbannasch users  635 Sep 22 22:22 readme.md
    -rwxr-xr-x 1 sbannasch users 1256 Oct 14 00:45 start_local_server.rb
    drwxrwsr-x 2 sbannasch users 4096 Sep 10 01:28 tmp
    -rw-r--r-- 1 sbannasch users 1090 Oct 14 00:45 update_jnlps.rb
    

Sharing a local server on a mac with bonjour/zeroconf
------------

    bin/start_bonjour.rb

Re-signing and generating pack-gzip versions of the jars.
------------
In order to communicate with the GoLink sensor interface the jars and native libraries need to be signed.

The jars and the pack.gz jars in the github repository are signed with Concord Consortiums certificate.

If you re-compile the java code and create new jars you will need to resign the jars.

You need a valid certificate

Copy the file bin/sign_sample.yml to bin/sign.yml and enter the password and alias for the certificate you want to use.

File: bin/sign_sample.yml

    --- 
    :password: password
    :alias: alias

To resign and recreate new pack.gz copies of the jar and native library resources:

    bin/resign_jars.rb

To resign and recreate new pack.gz archives for a subset of jars or native library resource add an argument consisting of a regex.

For example this will resign and pack all the jars with 'sensor' in their name:

    bin/resign_jars.rb sensor

Loading jnlps and the jars they reference from a remote maven-jnlp server.
------------
The Ruby script: update_jnlps.rb can be used if you would like to add additional collections of jars that are referenced from a jnlp served from a maven-jnlp server.

To use this script first install the jnlp gem:

    gem install jnlp

Then edit lines 19-20 in update_jnlps.rb to specify the url to the maven_jnlp server and the name of the family (or families) of jnlp to download.

    19 maven_jnlps_url = "http://jnlp.concord.org/dev/org/concord/maven-jnlp"
    20 families = %w{all-otrunk-snapshot}
    
In addition if you are downloading a jnlp with many jars this script will run much faster in JRuby. If you have installed rvm you can install and use Jruby for running this script as follows:

    rvm install jruby
    rvm use jruby
    ruby update_jnlps.rb