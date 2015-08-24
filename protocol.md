# PLUSULTRA PROTOCOL

## Plusultra Events

- plusultra::authenticate
Sent from the client to the platform in order to establish a connection.

- plusultra::welcome
Sent from the platform plusultra to clients after a succesful connection.

- plusultra::new_modality
Sent from the client when a new modality is attached to the platform. This 
message is broadcasted to every other client.

- plusultra::broadcast_new_modality
Plusultra -> to all the clients connected to an app when a modality is connected to the system.

- plusultra::modality_signal
Sent from the client when a modality driver has recognized (sensed) something. This message is broadcasted to every other client.

- plusultra::broadcast_modality_signal
Plusultra -> to all the clients connected to a specific app. Happens when a modality emits a signal.

- plusultra::interpretation
Client -> plusultra. Client emits a new interpretation object recognized by its fusion module.

- plusultra::interpretation
Client -> plusultra. Client alerts platform about a new interpretation.

- plusultra::broadcast_interpretation
plusultra -> to all the clients connected to a specific app. This alerts all the other clients about a interpretation detected locally by some client.

- plusultra::goodbye
Sent from the client to leave the platform.

