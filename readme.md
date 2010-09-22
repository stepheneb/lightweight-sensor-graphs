Vernier GoIO Lightweight Temperature Grapher
============================================

Install
------------

    gem install jnlp rack
    git clone git://github.com/stepheneb/lightweight-sensor-graphs.git
    cd lightweight-sensor-graphs
    cp config.sample.yml config.yml

Demo
------------

1. Plugin a Vernier GoLInk with an attached temperature probe.
2. Start local server.
    ruby start_local_server.rb
3. Open: http://localhost:4321/goio-temperature-graph.html/
4. Click the *start* button.