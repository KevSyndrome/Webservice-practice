package com.practice.api.external;

import static org.assertj.core.api.Assertions.assertThat;

import com.practice.api.external.grpcbin.HelloRequest;
import com.practice.api.external.grpcbin.HelloResponse;
import com.practice.api.external.grpcbin.HelloServiceGrpc;

import io.grpc.ManagedChannel;
import io.grpc.Server;
import io.grpc.inprocess.InProcessChannelBuilder;
import io.grpc.inprocess.InProcessServerBuilder;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class GrpcBinClientTests {

	Server server;
	ManagedChannel channel;

	@AfterEach
	void tearDown() {
		channel.shutdownNow();
		server.shutdownNow();
	}

	@Test
	void sendsGreetingAndReadsReply() throws Exception {
		// Servidor gRPC falso en memoria que imita a grpcb.in
		server = InProcessServerBuilder.forName("grpcbin-test").directExecutor()
			.addService(new HelloServiceGrpc.HelloServiceImplBase() {
				@Override
				public void sayHello(HelloRequest request, StreamObserver<HelloResponse> responses) {
					responses.onNext(HelloResponse.newBuilder().setReply("hello " + request.getGreeting()).build());
					responses.onCompleted();
				}
			})
			.build()
			.start();
		channel = InProcessChannelBuilder.forName("grpcbin-test").directExecutor().build();

		assertThat(new GrpcBinClient(channel).sayHello("Kevin")).isEqualTo("hello Kevin");
	}

}
