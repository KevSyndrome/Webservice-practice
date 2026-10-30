package com.practice.api.external;

import java.util.concurrent.TimeUnit;

import com.practice.api.external.grpcbin.HelloRequest;
import com.practice.api.external.grpcbin.HelloServiceGrpc;

import io.grpc.Channel;

/** Cliente gRPC de grpcb.in, con stubs generados desde protobuf/grpcbin/hello.proto. */
public class GrpcBinClient {

	private final Channel channel;

	public GrpcBinClient(Channel channel) {
		this.channel = channel;
	}

	public String sayHello(String greeting) {
		return HelloServiceGrpc.newBlockingStub(channel)
			.withDeadlineAfter(5, TimeUnit.SECONDS)
			.sayHello(HelloRequest.newBuilder().setGreeting(greeting).build())
			.getReply();
	}

}
