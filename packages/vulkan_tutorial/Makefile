CFLAGS = -std=c++17 -O2 -Wall
LDFLAGS = -lglfw -lvulkan -ldl -lpthread -lX11 -lXxf86vm -lXrandr -lXi

# Configures libvulkan to use the nvidia driver
export VK_ICD_FILENAMES = /usr/share/vulkan/icd.d/nvidia_icd.json

.PHONY: test clean

VulkanTest: main.cpp shaders/shader.vert.spv shaders/shader.frag.spv
		g++ $(CFLAGS) -o $@ $< $(LDFLAGS)

%.vert.spv: %.vert
		glslc $< -o $@

%.frag.spv: %.frag
		glslc $< -o $@

test: VulkanTest
		./VulkanTest

clean:
		rm -f VulkanTest
		rm shaders/*.spv

info:
		vulkaninfo