CFLAGS = -std=c++17 -O2 -Wall -Werror
LDFLAGS = -lglfw -lvulkan -ldl -lpthread -lX11 -lXxf86vm -lXrandr -lXi

# Configures libvulkan to use the nvidia driver
export VK_ICD_FILENAMES = /usr/share/vulkan/icd.d/nvidia_icd.json

.PHONY: test clean

VulkanTest: main.cpp
		g++ $(CFLAGS) -o $@ $^ $(LDFLAGS)

test: VulkanTest
		./VulkanTest

clean:
		rm -f VulkanTest

info:
		vulkaninfo