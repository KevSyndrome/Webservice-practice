package com.practice.api.product;

import java.util.concurrent.TimeUnit;
import java.util.function.Function;

import com.google.protobuf.Message;
import com.google.protobuf.TextFormat;
import com.practice.api.product.grpc.v1.CreateProductRequest;
import com.practice.api.product.grpc.v1.GetProductRequest;
import com.practice.api.product.grpc.v1.ListProductsRequest;
import com.practice.api.product.grpc.v1.ProductServiceGrpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import jakarta.annotation.PreDestroy;

import org.springframework.context.event.EventListener;
import org.springframework.grpc.server.lifecycle.GrpcServerStartedEvent;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Los navegadores no hablan gRPC nativo (HTTP/2 con tramas binarias). Este puente recibe JSON, llama al
 * servidor gRPC real como cliente y devuelve los mensajes protobuf en formato texto y su tamaño en bytes.
 */
@RestController
@RequestMapping("/api/v1/grpc-bridge/products")
public class GrpcBridgeController {

	private static final String SERVICE = "products.v1.ProductService/";

	private volatile ManagedChannel channel;

	@EventListener
	void connect(GrpcServerStartedEvent event) {
		channel = ManagedChannelBuilder.forAddress("localhost", event.getPort()).usePlaintext().build();
	}

	@PreDestroy
	void disconnect() {
		if (channel != null) {
			channel.shutdownNow();
		}
	}

	@GetMapping
	public ResponseEntity<GrpcCall> list() {
		return call("ListProducts", ListProductsRequest.getDefaultInstance(), stub -> stub::listProducts);
	}

	@GetMapping("/{id}")
	public ResponseEntity<GrpcCall> get(@PathVariable long id) {
		return call("GetProduct", GetProductRequest.newBuilder().setId(id).build(), stub -> stub::getProduct);
	}

	@PostMapping
	public ResponseEntity<GrpcCall> create(@RequestBody NewProduct body) {
		CreateProductRequest request = CreateProductRequest.newBuilder()
			.setName(body.name() == null ? "" : body.name())
			.setPrice(body.price() == null ? "" : body.price())
			.build();
		return call("CreateProduct", request, stub -> stub::createProduct);
	}

	private <Q extends Message> ResponseEntity<GrpcCall> call(String method, Q request,
			Function<ProductServiceGrpc.ProductServiceBlockingStub, Function<Q, ? extends Message>> rpc) {
		var stub = ProductServiceGrpc.newBlockingStub(channel).withDeadlineAfter(5, TimeUnit.SECONDS);
		long started = System.nanoTime();
		try {
			Message response = rpc.apply(stub).apply(request);
			return ResponseEntity.ok(new GrpcCall(SERVICE + method, "OK", null, text(request),
					request.getSerializedSize(), text(response), response.getSerializedSize(), millis(started)));
		}
		catch (StatusRuntimeException e) {
			int http = switch (e.getStatus().getCode()) {
				case NOT_FOUND -> 404;
				case INVALID_ARGUMENT -> 400;
				default -> 502;
			};
			return ResponseEntity.status(http)
				.body(new GrpcCall(SERVICE + method, e.getStatus().getCode().name(), e.getStatus().getDescription(),
						text(request), request.getSerializedSize(), null, 0, millis(started)));
		}
	}

	private static String text(Message message) {
		// Sin escapar no-ASCII: si no, "Ratón" se mostraría como "Rat\303\263n"
		String body = TextFormat.printer().escapingNonAscii(false).printToString(message).strip();
		String type = message.getDescriptorForType().getFullName();
		return body.isEmpty() ? type + " {}" : type + " {\n" + body.indent(2) + "}";
	}

	private static long millis(long startedNanos) {
		return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedNanos);
	}

	public record NewProduct(String name, String price) {
	}

	/** Una llamada gRPC tal como ocurrió: método, código de estado y mensajes protobuf. */
	public record GrpcCall(String method, String status, String error, String request, int requestBytes,
			String response, int responseBytes, long ms) {
	}

}
