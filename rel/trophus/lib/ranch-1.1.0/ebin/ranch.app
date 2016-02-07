{application,ranch,
             [{description,"Socket acceptor pool for TCP protocols."},
              {vsn,"1.1.0"},
              {id,"git"},
              {modules,[ranch,ranch_acceptor,ranch_acceptors_sup,ranch_app,
                        ranch_conns_sup,ranch_listener_sup,ranch_protocol,
                        ranch_server,ranch_ssl,ranch_sup,ranch_tcp,
                        ranch_transport]},
              {registered,[ranch_sup,ranch_server]},
              {applications,[kernel,stdlib]},
              {mod,{ranch_app,[]}},
              {env,[]}]}.